import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db';

describe('HU: Cancelación voluntaria o administrativa y liberación inmediata (SCRUM-65)', () => {
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let gatoId: string;
  let postulacionActivaId: string;
  let postulacionAprobadaId: string;

  beforeAll(async () => {
    const usersRes = await query('SELECT id, rol_id FROM public.usuarios LIMIT 2');
    if (usersRes.rows.length >= 2) {
      user1Id = usersRes.rows[0].id;
      user2Id = usersRes.rows[1].id;
    } else {
      user1Id = usersRes.rows[0]?.id;
      const rolId = usersRes.rows[0]?.rol_id || 2;
      const newUser = await query(`
        INSERT INTO public.usuarios (nombre_completo, email, password_hash, rol_id, activo)
        VALUES ('Usuario Test Dos', 'test2_${Date.now()}@teocat.bo', 'hash', $1, TRUE)
        RETURNING id;
      `, [rolId]);
      user2Id = newUser.rows[0].id;
    }

    user1Token = jwt.sign({ id: user1Id, email: 'user1@teocat.bo', rol: 'USUARIO' }, secret);
    user2Token = jwt.sign({ id: user2Id, email: 'user2@teocat.bo', rol: 'USUARIO' }, secret);

    const gatoRes = await query(`
      INSERT INTO public.gatos (nombre, codigo_felino, estado)
      VALUES ('Mishi Cancelable', 'TEST-CAN-${Date.now()}', 'ADOPCION')
      RETURNING id;
    `);
    gatoId = gatoRes.rows[0].id;

    const postActivaRes = await query(`
      INSERT INTO public.postulaciones_adopcion 
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio)
      VALUES ($1, $2, 'EN_REVISION', '{}', 250, '77712345', 'Av. 6 de Agosto #100')
      RETURNING id;
    `, [user1Id, gatoId]);
    postulacionActivaId = postActivaRes.rows[0].id;

    const postAprobadaRes = await query(`
      INSERT INTO public.postulaciones_adopcion 
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio)
      VALUES ($1, $2, 'APROBADA', '{}', 350, '77712345', 'Av. Arce #200')
      RETURNING id;
    `, [user1Id, gatoId]);
    postulacionAprobadaId = postAprobadaRes.rows[0].id;
  });

  afterAll(async () => {
    if (postulacionActivaId || postulacionAprobadaId) {
      await query('DELETE FROM public.postulaciones_adopcion WHERE id IN ($1, $2)', [
        postulacionActivaId,
        postulacionAprobadaId,
      ]);
    }
    if (gatoId) {
      await query('DELETE FROM public.gatos WHERE id = $1', [gatoId]);
    }
    await pool.end();
  });

  it('DoD 2: Debe rechazar con 400 Bad Request si no se envía el motivo de baja', async () => {
    const res = await request(app)
      .patch(`/api/postulaciones/${postulacionActivaId}/cancelar`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/obligatoriamente el motivo/i);
  });

  it('DoD 4: Debe retornar 403 Forbidden si un usuario intenta cancelar la postulación de otro', async () => {
    const res = await request(app)
      .patch(`/api/postulaciones/${postulacionActivaId}/cancelar`)
      .set('Authorization', `Bearer ${user2Token}`)
      .send({ motivo: 'Intento ajeno' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/autorización/i);
  });

  it('DoD 3: Debe retornar 409 Conflict si se intenta cancelar una postulación aprobada', async () => {
    const res = await request(app)
      .patch(`/api/postulaciones/${postulacionAprobadaId}/cancelar`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ motivo: 'Cambio de parecer' });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/contrato firmado/i);
  });

  it('DoD 1 y SCRUM-65: Cancela con éxito (200 OK), libera al felino a DISPONIBLE y reaparece en catálogo público', async () => {
    const res = await request(app)
      .patch(`/api/postulaciones/${postulacionActivaId}/cancelar`)
      .set('Authorization', `Bearer ${user1Token}`)
      .send({ motivo: 'Motivos personales de viaje imprevisto' });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.estado).toBe('CANCELADA');
    expect(res.body.data.motivo_baja).toBe('Motivos personales de viaje imprevisto');

    const gatoBD = await query('SELECT estado FROM public.gatos WHERE id = $1', [gatoId]);
    expect(gatoBD.rows[0].estado).toBe('DISPONIBLE');

    const publicRes = await request(app).get('/api/public/cats');
    expect(publicRes.status).toBe(200);
    const listaGatos = Array.isArray(publicRes.body.data) ? publicRes.body.data : publicRes.body;
    const gatoEnCatalogo = listaGatos.find((g: any) => g.id === gatoId);
    expect(gatoEnCatalogo).toBeDefined();
    expect(gatoEnCatalogo.estado).toBe('DISPONIBLE');
  });
});