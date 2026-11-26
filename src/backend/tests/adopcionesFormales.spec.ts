import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db';

describe('HU: Vinculación histórica e inmutable entre adoptante aprobado y felino', () => {
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let gatoId: string;
  let postulacionAprobada1Id: string;
  let postulacionAprobada2Id: string;

  beforeAll(async () => {
    const userRes = await query('SELECT id FROM public.usuarios LIMIT 1');
    userId = userRes.rows[0]?.id;
    adminToken = jwt.sign({ id: userId, email: 'admin@teocat.bo', rol: 'ADMIN' }, secret);
    userToken = jwt.sign({ id: userId, email: 'adoptante@teocat.bo', rol: 'USUARIO' }, secret);

    // Crear felino disponible para adopción
    const gatoRes = await query(`
      INSERT INTO public.gatos (nombre, codigo_felino, estado)
      VALUES ('Nala Vinculo', 'VINC-${Date.now()}', 'ADOPCION')
      RETURNING id;
    `);
    gatoId = gatoRes.rows[0].id;

    // Postulación 1 aprobada con dictamen APROBADA
    const p1 = await query(`
      INSERT INTO public.postulaciones_adopcion
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio, documentacion_completa)
      VALUES ($1, $2, 'APROBADA', '{}', 450, '77788899', 'Sopocachi Calle Belisario Salinas #410', TRUE)
      RETURNING id;
    `, [userId, gatoId]);
    postulacionAprobada1Id = p1.rows[0].id;

    await query(`
      INSERT INTO public.visitas_domiciliarias
        (postulacion_id, evaluador_id, fecha_visita, hora_inicio, hora_fin, direccion_confirmada, estado, dictamen, observaciones_dictamen)
      VALUES ($1, $2, '2026-12-15', '10:00', '11:00', 'Sopocachi Calle Belisario Salinas #410', 'REALIZADA', 'APROBADA', 'Vivienda apta.')
    `, [postulacionAprobada1Id, userId]);

    // Postulación 2 aprobada sobre el mismo felino (para verificar bloqueo 409 Conflict)
    const p2 = await query(`
      INSERT INTO public.postulaciones_adopcion
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio, documentacion_completa)
      VALUES ($1, $2, 'APROBADA', '{}', 500, '77700011', 'Miraflores Av. Busch #900', TRUE)
      RETURNING id;
    `, [userId, gatoId]);
    postulacionAprobada2Id = p2.rows[0].id;

    await query(`
      INSERT INTO public.visitas_domiciliarias
        (postulacion_id, evaluador_id, fecha_visita, hora_inicio, hora_fin, direccion_confirmada, estado, dictamen, observaciones_dictamen)
      VALUES ($1, $2, '2026-12-16', '10:00', '11:00', 'Miraflores Av. Busch #900', 'REALIZADA', 'APROBADA', 'Vivienda apta.')
    `, [postulacionAprobada2Id, userId]);
  });

  afterAll(async () => {
    const postIds = [postulacionAprobada1Id, postulacionAprobada2Id].filter(Boolean);
    if (gatoId) {
      await query('DELETE FROM public.adopciones_formales WHERE gato_id = $1', [gatoId]);
    }
    if (postIds.length > 0) {
      await query('DELETE FROM public.visitas_domiciliarias WHERE postulacion_id = ANY($1::uuid[])', [postIds]);
      await query('DELETE FROM public.postulaciones_adopcion WHERE id = ANY($1::uuid[])', [postIds]);
    }
    if (gatoId) {
      await query('DELETE FROM public.gatos WHERE id = $1', [gatoId]);
    }
    await pool.end();
  });

  // DoD 1 & DoD 2: Consolidación del vínculo (201 Created) y cambio de estado del felino a ADOPTADO
  it('DoD 1 y 2: Consolida el vínculo formal (201 Created) y cambia el estado del felino a ADOPTADO', async () => {
    const res = await request(app)
      .post('/api/admin/adopciones/vincular')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        postulacionId: postulacionAprobada1Id,
        observacionesEntrega: 'Entrega formal realizada con cartilla sanitaria completa.',
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.adopcionFormal.estadoVinculo).toBe('VIGENTE');
    expect(res.body.data.felino.estado).toBe('ADOPTADO');
    expect(res.body.data.postulacion.estado).toBe('APROBADA_FINALIZADA');
  });

  // DoD 3: Bloqueo 409 Conflict si se intenta vincular por segunda vez un gato ya adoptado
  it('DoD 3: Bloquea con 409 Conflict el intento de crear un segundo enlace de adopción vigente sobre el mismo felino', async () => {
    const res = await request(app)
      .post('/api/admin/adopciones/vincular')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        postulacionId: postulacionAprobada2Id,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/ADOPTADO|vigente/i);
  });

  // DoD 2: Rechazar cualquier nueva postulación sobre el gato ya adoptado con 409 Conflict
  it('DoD 2: Rechaza con 409 Conflict cualquier nueva postulación sobre un felino ya ADOPTADO', async () => {
    const res = await request(app)
      .post('/api/postulaciones')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        gatoId,
        cuestionario: {
          tieneMallasProteccion: true,
          permisoPropietario: true,
          compromisoTenenciaResponsable: true,
        },
        presupuestoMensual: 350,
        telefonoContacto: '77799900',
        direccionDomicilio: 'Obrajes Calle 5',
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/ADOPTADO/i);
  });

  // DoD 4: Ficha administrativa del gato muestra datos de contacto y dirección del adoptante (200 OK)
  it('DoD 4: Al consultar la ficha administrativa del gato retorna 200 OK con los datos de contacto y dirección del adoptante', async () => {
    const res = await request(app)
      .get(`/api/admin/cats/${gatoId}/ficha`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.felino.estado).toBe('ADOPTADO');
    expect(res.body.data.propietarioAdoptanteActual).toBeDefined();
    expect(res.body.data.propietarioAdoptanteActual.direccionTenencia).toBe('Sopocachi Calle Belisario Salinas #410');
    expect(res.body.data.propietarioAdoptanteActual.telefonoTenencia).toBe('77788899');
  });
});