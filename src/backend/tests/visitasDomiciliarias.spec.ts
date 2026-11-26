import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db';
import crypto from 'crypto';

describe('HU: Programación de visitas de inspección domiciliaria (SCRUM-81)', () => {
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';
  let adminToken: string;
  let adminId: string;
  let gatoId: string;
  let postulacionIncompletaId: string;
  let postulacionCompleta1Id: string;
  let postulacionCompleta2Id: string;

  beforeAll(async () => {
    const userRes = await query('SELECT id FROM public.usuarios LIMIT 1');
    adminId = userRes.rows[0]?.id;
    adminToken = jwt.sign({ id: adminId, email: 'admin@teocat.bo', rol: 'ADMIN' }, secret);

    const gatoRes = await query(`
      INSERT INTO public.gatos (nombre, codigo_felino, estado)
      VALUES ('Luna Visita', 'VIS-TEST-${Date.now()}', 'ADOPCION')
      RETURNING id;
    `);
    gatoId = gatoRes.rows[0].id;

    // 1. Postulación SIN los 3 documentos
    const postIncRes = await query(`
      INSERT INTO public.postulaciones_adopcion 
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio)
      VALUES ($1, $2, 'EN_REVISION', '{}', 250, '77711111', 'Zona Sur Calle 10')
      RETURNING id;
    `, [adminId, gatoId]);
    postulacionIncompletaId = postIncRes.rows[0].id;

    // 2. Postulación 1 con documentos completos
    const postComp1Res = await query(`
      INSERT INTO public.postulaciones_adopcion 
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio)
      VALUES ($1, $2, 'EN_REVISION', '{}', 300, '77722222', 'Sopocachi Av. Ecuador #500')
      RETURNING id;
    `, [adminId, gatoId]);
    postulacionCompleta1Id = postComp1Res.rows[0].id;

    // 3. Postulación 2 con documentos completos (probar choque de horario)
    const postComp2Res = await query(`
      INSERT INTO public.postulaciones_adopcion 
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio)
      VALUES ($1, $2, 'EN_REVISION', '{}', 350, '77733333', 'Miraflores Calle Díaz Romero #320')
      RETURNING id;
    `, [adminId, gatoId]);
    postulacionCompleta2Id = postComp2Res.rows[0].id;

    // Obtener columnas NOT NULL sin valor por defecto de public.documentos_postulacion
    const colsRes = await query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'documentos_postulacion'
        AND is_nullable = 'NO'
        AND column_default IS NULL;
    `);

    const tipos = ['CI', 'LUZ_AGUA', 'CROQUIS'];
    for (const postId of [postulacionCompleta1Id, postulacionCompleta2Id]) {
      for (const tipo of tipos) {
        const colNames: string[] = [];
        const placeholders: string[] = [];
        const values: any[] = [];

        colsRes.rows.forEach((col: any, idx: number) => {
          colNames.push(col.column_name);
          placeholders.push(`$${idx + 1}`);

          if (col.column_name === 'postulacion_id') {
            values.push(postId);
          } else if (col.column_name === 'tipo_documento') {
            values.push(tipo);
          } else if (col.data_type.includes('int') || col.data_type === 'numeric') {
            values.push(1024);
          } else if (col.data_type === 'boolean') {
            values.push(true);
          } else if (col.data_type === 'uuid') {
            values.push(adminId);
          } else {
            values.push(`test_${tipo}_${crypto.randomBytes(4).toString('hex')}`);
          }
        });

        await query(
          `INSERT INTO public.documentos_postulacion (${colNames.join(', ')}) VALUES (${placeholders.join(', ')})`,
          values
        );
      }
    }
  });

  afterAll(async () => {
    const ids = [postulacionIncompletaId, postulacionCompleta1Id, postulacionCompleta2Id].filter(Boolean);
    if (ids.length > 0) {
      await query('DELETE FROM public.visitas_domiciliarias WHERE postulacion_id = ANY($1::uuid[])', [ids]);
      await query('DELETE FROM public.documentos_postulacion WHERE postulacion_id = ANY($1::uuid[])', [ids]);
      await query('DELETE FROM public.postulaciones_adopcion WHERE id = ANY($1::uuid[])', [ids]);
    }
    if (gatoId) {
      await query('DELETE FROM public.gatos WHERE id = $1', [gatoId]);
    }
    await pool.end();
  });

  // DoD 3: Rechazo 400 Bad Request si faltan los 3 documentos
  it('DoD 3: Debe rechazar con 400 Bad Request si la postulación no tiene sus 3 documentos cargados', async () => {
    const res = await request(app)
      .post('/api/admin/visitas-domiciliarias')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        postulacionId: postulacionIncompletaId,
        fechaVisita: '2026-12-10',
        horaInicio: '10:00',
        horaFin: '11:00',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/3 documentos obligatorios/i);
  });

  // DoD 1 & DoD 4: Agendamiento exitoso (201 Created) y transición de estado a VISITA_PROGRAMADA
  it('DoD 1 y 4: Agenda la visita con éxito (201 Created) y cambia el estado de la postulación a VISITA_PROGRAMADA', async () => {
    const res = await request(app)
      .post('/api/admin/visitas-domiciliarias')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        postulacionId: postulacionCompleta1Id,
        fechaVisita: '2026-12-10',
        horaInicio: '14:00',
        horaFin: '15:00',
        observaciones: 'Verificar mallas en ventanas de balcón.',
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.visita.estado).toBe('PROGRAMADA');
    expect(res.body.data.postulacion.estado).toBe('VISITA_PROGRAMADA');

    const postBD = await query('SELECT estado FROM public.postulaciones_adopcion WHERE id = $1', [postulacionCompleta1Id]);
    expect(postBD.rows[0].estado).toBe('VISITA_PROGRAMADA');
  });

  // DoD 2 & SCRUM-81: Bloqueo 409 Conflict ante doble agendamiento en el mismo rango horario
  it('DoD 2 y SCRUM-81: Debe bloquear con 409 Conflict si se intenta agendar otra visita en la misma fecha y hora', async () => {
    const res = await request(app)
      .post('/api/admin/visitas-domiciliarias')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        postulacionId: postulacionCompleta2Id,
        fechaVisita: '2026-12-10',
        horaInicio: '14:30',
        horaFin: '15:30',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Conflicto de agenda/i);
  });
});