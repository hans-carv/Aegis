// tests/postulaciones.spec.ts
import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db';

describe('HU: Formulario inmutable de postulación de adopción (SCRUM-54)', () => {
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';
  let userToken: string;
  let gatoDisponibleId: string;
  let gatoAdoptadoId: string;
  let postulacionCreadaId: string;

  beforeAll(async () => {
    const userRes = await query('SELECT id FROM public.usuarios LIMIT 1');
    const userId = userRes.rows[0]?.id;
    userToken = jwt.sign({ id: userId, email: 'postulante@teocat.bo', rol: 'USUARIO' }, secret);

    const resDisp = await query(`
      INSERT INTO public.gatos (nombre, codigo_felino, estado)
      VALUES ('Mishi Test Disponible', 'GAT-TEST-01', 'DISPONIBLE')
      RETURNING id;
    `);
    gatoDisponibleId = resDisp.rows[0].id;

    const resAdop = await query(`
      INSERT INTO public.gatos (nombre, codigo_felino, estado)
      VALUES ('Mishi Test Adoptado', 'GAT-TEST-02', 'ADOPTADO')
      RETURNING id;
    `);
    gatoAdoptadoId = resAdop.rows[0].id;
  });

  afterAll(async () => {
    if (postulacionCreadaId) {
      await query('DELETE FROM public.postulaciones_adopcion WHERE id = $1', [postulacionCreadaId]);
    }
    if (gatoDisponibleId || gatoAdoptadoId) {
      await query('DELETE FROM public.gatos WHERE id IN ($1, $2)', [gatoDisponibleId, gatoAdoptadoId]);
    }
    await pool.end();
  });

  it('DoD 2: Debe rechazar con 400 Bad Request si faltan respuestas obligatorias de seguridad', async () => {
    const res = await request(app)
      .post('/api/postulaciones')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        gatoId: gatoDisponibleId,
        presupuestoMensual: 250,
        telefonoContacto: '77712345',
        direccionDomicilio: 'Av. Principal #123',
        cuestionario: {
          tieneMallasProteccion: true,
        },
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/obligatorias/i);
  });

  it('DoD 4: Debe rechazar con 409 Conflict si el felino no está disponible para adopción', async () => {
    const res = await request(app)
      .post('/api/postulaciones')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        gatoId: gatoAdoptadoId,
        presupuestoMensual: 300,
        telefonoContacto: '77712345',
        direccionDomicilio: 'Calle Falsa 123',
        cuestionario: {
          tieneMallasProteccion: true,
          permisoPropietario: true,
          compromisoTenenciaResponsable: true,
        },
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/no se encuentra disponible/i);
  });

  it('DoD 1: Debe registrar la postulación en estado EN_REVISION y retornar 201 Created', async () => {
    const res = await request(app)
      .post('/api/postulaciones')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        gatoId: gatoDisponibleId,
        presupuestoMensual: 350,
        telefonoContacto: '77712345',
        direccionDomicilio: 'Calle Los Álamos #45',
        cuestionario: {
          tieneMallasProteccion: true,
          permisoPropietario: true,
          compromisoTenenciaResponsable: true,
          otrosAnimalesEnCasa: 'Ninguno',
          tiempoSoloAlDiaHoras: 4,
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.estado).toBe('EN_REVISION');
    postulacionCreadaId = res.body.data.id;
  });

  it('DoD 3: Debe retornar 403 Forbidden ante cualquier intento de edición PUT', async () => {
    const res = await request(app)
      .put(`/api/postulaciones/${postulacionCreadaId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        presupuestoMensual: 500,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/inmutables/i);
  });
});