import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db';

describe('HU: Emisión de dictamen de visita domiciliaria', () => {
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';
  let adminToken: string;
  let userToken: string;
  let userId: string;
  let gatoRechazoId: string;
  let gatoAprobadoId: string;
  let postulacionRechazoId: string;
  let postulacionAprobadoId: string;
  let visitaRechazoId: string;
  let visitaAprobadoId: string;

  beforeAll(async () => {
    const userRes = await query('SELECT id FROM public.usuarios LIMIT 1');
    userId = userRes.rows[0]?.id;
    adminToken = jwt.sign({ id: userId, email: 'admin@teocat.bo', rol: 'ADMIN' }, secret);
    userToken = jwt.sign({ id: userId, email: 'cliente@teocat.bo', rol: 'USUARIO' }, secret);

    // 1. Gato y visita que será RECHAZADA (inicialmente en estado ADOPCION, fuera de DISPONIBLE)
    const g1 = await query(`
      INSERT INTO public.gatos (nombre, codigo_felino, estado)
      VALUES ('Michi Rechazo', 'DIC-RECH-${Date.now()}', 'ADOPCION')
      RETURNING id;
    `);
    gatoRechazoId = g1.rows[0].id;

    const p1 = await query(`
      INSERT INTO public.postulaciones_adopcion
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio, documentacion_completa)
      VALUES ($1, $2, 'VISITA_PROGRAMADA', '{}', 300, '77744444', 'Calacoto Calle 15', TRUE)
      RETURNING id;
    `, [userId, gatoRechazoId]);
    postulacionRechazoId = p1.rows[0].id;

    const v1 = await query(`
      INSERT INTO public.visitas_domiciliarias
        (postulacion_id, evaluador_id, fecha_visita, hora_inicio, hora_fin, direccion_confirmada, estado)
      VALUES ($1, $2, '2026-12-12', '10:00', '11:00', 'Calacoto Calle 15', 'PROGRAMADA')
      RETURNING id;
    `, [postulacionRechazoId, userId]);
    visitaRechazoId = v1.rows[0].id;

    // 2. Gato y visita que pasará por PENDIENTE_ADECUACIONES y luego APROBADA
    const g2 = await query(`
      INSERT INTO public.gatos (nombre, codigo_felino, estado)
      VALUES ('Simba Aprobado', 'DIC-APRO-${Date.now()}', 'ADOPCION')
      RETURNING id;
    `);
    gatoAprobadoId = g2.rows[0].id;

    const p2 = await query(`
      INSERT INTO public.postulaciones_adopcion
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio, documentacion_completa)
      VALUES ($1, $2, 'VISITA_PROGRAMADA', '{}', 400, '77755555', 'Achumani Calle 22', TRUE)
      RETURNING id;
    `, [userId, gatoAprobadoId]);
    postulacionAprobadoId = p2.rows[0].id;

    const v2 = await query(`
      INSERT INTO public.visitas_domiciliarias
        (postulacion_id, evaluador_id, fecha_visita, hora_inicio, hora_fin, direccion_confirmada, estado)
      VALUES ($1, $2, '2026-12-12', '15:00', '16:00', 'Achumani Calle 22', 'PROGRAMADA')
      RETURNING id;
    `, [postulacionAprobadoId, userId]);
    visitaAprobadoId = v2.rows[0].id;
  });

  afterAll(async () => {
    const postIds = [postulacionRechazoId, postulacionAprobadoId].filter(Boolean);
    if (postIds.length > 0) {
      await query('DELETE FROM public.visitas_domiciliarias WHERE postulacion_id = ANY($1::uuid[])', [postIds]);
      await query('DELETE FROM public.postulaciones_adopcion WHERE id = ANY($1::uuid[])', [postIds]);
    }
    const gatoIds = [gatoRechazoId, gatoAprobadoId].filter(Boolean);
    if (gatoIds.length > 0) {
      await query('DELETE FROM public.gatos WHERE id = ANY($1::uuid[])', [gatoIds]);
    }
    await pool.end();
  });

  // DoD 3: Dictamen RECHAZADA cierra postulación y libera automáticamente al gato a DISPONIBLE
  it('DoD 3: Dictamen RECHAZADA cierra la postulación y libera al felino al catálogo público (DISPONIBLE)', async () => {
    const res = await request(app)
      .patch(`/api/admin/visitas-domiciliarias/${visitaRechazoId}/dictamen`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        dictamen: 'RECHAZADA',
        observaciones: 'Vivienda sin cerramiento perimetral y en avenida de alto tráfico sin protección.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.visita.dictamen).toBe('RECHAZADA');
    expect(res.body.data.postulacion.estado).toBe('RECHAZADA');
    expect(res.body.data.gatoLiberado.estado).toBe('DISPONIBLE');

    // Verificar que el gato vuelve a aparecer en el catálogo público
    const publicRes = await request(app).get('/api/public/cats');
    const lista = Array.isArray(publicRes.body.data) ? publicRes.body.data : publicRes.body;
    expect(lista.some((g: any) => g.id === gatoRechazoId)).toBe(true);
  });

  // DoD 1, DoD 2 y DoD 4: PENDIENTE_ADECUACIONES habilita plazo, permite subir evidencia y bloquea contrato con 409
  it('DoD 1, 2 y 4: Dictamen PENDIENTE_ADECUACIONES habilita plazo de mejora y bloquea generación de contrato con 409 Conflict', async () => {
    const resDictamen = await request(app)
      .patch(`/api/admin/visitas-domiciliarias/${visitaAprobadoId}/dictamen`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        dictamen: 'PENDIENTE_ADECUACIONES',
        observaciones: 'Colocar malla de seguridad en el balcón del segundo piso.',
        diasPlazoSubsanacion: 5,
      });

    expect(resDictamen.status).toBe(200);
    expect(resDictamen.body.data.visita.dictamen).toBe('PENDIENTE_ADECUACIONES');
    expect(resDictamen.body.data.visita.fechaLimiteSubsanacion).toBeDefined();
    expect(resDictamen.body.data.postulacion.estado).toBe('PENDIENTE_ADECUACIONES');

    // DoD 4: Intentar generar contrato estando en PENDIENTE_ADECUACIONES -> debe retornar 409 Conflict
    const resContratoBloqueado = await request(app)
      .post(`/api/admin/postulaciones/${postulacionAprobadoId}/contrato`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resContratoBloqueado.status).toBe(409);

    // DoD 2: Postulante sube evidencia fotográfica de las mejoras dentro del plazo
    const resEvidencia = await request(app)
      .post(`/api/visitas-domiciliarias/${visitaAprobadoId}/evidencias`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        evidenciaUrls: ['https://storage.aegis.bo/evidencias/malla-balcon-1.jpg'],
      });

    expect(resEvidencia.status).toBe(200);
    expect(resEvidencia.body.data.evidenciaAdecuacionesUrls.length).toBe(1);
  });

  // DoD 1 & DoD 4: Dictamen APROBADA habilita finalmente el contrato (200 OK)
  it('DoD 1 y 4: Al aprobar el dictamen (APROBADA), habilita el paso a generación de contrato (200 OK)', async () => {
    const resAprobar = await request(app)
      .patch(`/api/admin/visitas-domiciliarias/${visitaAprobadoId}/dictamen`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        dictamen: 'APROBADA',
        observaciones: 'Malla instalada y verificada correctamente. Apto para entrega.',
      });

    expect(resAprobar.status).toBe(200);
    expect(resAprobar.body.data.visita.dictamen).toBe('APROBADA');
    expect(resAprobar.body.data.postulacion.estado).toBe('APROBADA');

    const resContratoOk = await request(app)
      .post(`/api/admin/postulaciones/${postulacionAprobadoId}/contrato`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resContratoOk.status).toBe(200);
    expect(resContratoOk.body.data.habilitadoContrato).toBe(true);
  });
});