import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db';

describe('HU: Control clínico de vacunas y desparasitaciones (SCRUM-72)', () => {
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';
  let userToken: string;
  let adminToken: string;
  let gatoId: string;

  beforeAll(async () => {
    const userRes = await query('SELECT id FROM public.usuarios LIMIT 1');
    const userId = userRes.rows[0]?.id;

    userToken = jwt.sign({ id: userId, email: 'cliente@teocat.bo', rol: 'USUARIO' }, secret);
    adminToken = jwt.sign({ id: userId, email: 'admin@teocat.bo', rol: 'ADMIN' }, secret);

    const gatoRes = await query(`
      INSERT INTO public.gatos (nombre, codigo_felino, estado)
      VALUES ('Salem Clínico', 'CLIN-TEST-${Date.now()}', 'CUARENTENA')
      RETURNING id;
    `);
    gatoId = gatoRes.rows[0].id;
  });

  afterAll(async () => {
    if (gatoId) {
      await query('DELETE FROM public.controles_inmunologicos WHERE gato_id = $1', [gatoId]);
      await query('DELETE FROM public.gatos WHERE id = $1', [gatoId]);
    }
    await pool.end();
  });

  // DoD 3: Ocultamiento y restricción al público / usuarios sin rol ADMIN (403 Forbidden)
  it('DoD 3: Debe retornar 403 Forbidden si un usuario sin rol ADMIN intenta registrar o ver controles médicos', async () => {
    const resPost = await request(app)
      .post(`/api/admin/cats/${gatoId}/inmunizaciones`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        tipoControl: 'VACUNA',
        nombreBiologico: 'Triple Felina',
        fechaAplicacion: '2026-11-01',
        fechaProximoRefuerzo: '2026-11-22',
      });
    expect(resPost.status).toBe(403);

    const resGet = await request(app)
      .get(`/api/cats/${gatoId}/vacunas`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(resGet.status).toBe(403);
  });

  // DoD 2: Rechazo ante fechas incoherentes (400 Bad Request)
  it('DoD 2: Debe rechazar con 400 Bad Request si el próximo refuerzo es anterior o igual a la fecha de aplicación', async () => {
    // Caso fecha igual
    const resIgual = await request(app)
      .post(`/api/admin/cats/${gatoId}/inmunizaciones`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipoControl: 'VACUNA',
        nombreBiologico: 'Rabia',
        fechaAplicacion: '2026-11-10',
        fechaProximoRefuerzo: '2026-11-10',
      });
    expect(resIgual.status).toBe(400);
    expect(resIgual.body.message).toMatch(/posterior a la fecha de aplicación/i);

    // Caso fecha anterior
    const resAnterior = await request(app)
      .post(`/api/admin/cats/${gatoId}/inmunizaciones`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipoControl: 'DESPARASITACION',
        nombreBiologico: 'Drontal Gatos',
        fechaAplicacion: '2026-11-10',
        fechaProximoRefuerzo: '2026-11-05',
      });
    expect(resAnterior.status).toBe(400);
  });

  // DoD 1: Registro exitoso (201 Created)
  it('DoD 1: Registra vacunas y desparasitaciones válidas retornando HTTP 201 Created', async () => {
    const res1 = await request(app)
      .post(`/api/admin/cats/${gatoId}/inmunizaciones`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipoControl: 'DESPARASITACION',
        nombreBiologico: 'Drontal Gatos',
        fechaAplicacion: '2026-10-15',
        fechaProximoRefuerzo: '2027-01-15',
        veterinarioResponsable: 'Dra. Camila Rojas',
      });
    expect(res1.status).toBe(201);
    expect(res1.body.ok).toBe(true);

    const res2 = await request(app)
      .post(`/api/admin/cats/${gatoId}/inmunizaciones`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipoControl: 'VACUNA',
        nombreBiologico: 'Triple Felina (1ra Dosis)',
        fechaAplicacion: '2026-11-01',
        fechaProximoRefuerzo: '2026-11-22',
        lote: 'TF-2026-88',
      });
    expect(res2.status).toBe(201);
  });

  // DoD 4: Consulta cronológica (200 OK)
  it('DoD 4: Devuelve el historial clínico ordenado cronológicamente con HTTP 200 OK', async () => {
    const res = await request(app)
      .get(`/api/cats/${gatoId}/vacunas`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.length).toBe(2);
    // Verificar orden ascendente por fechaAplicacion
    expect(res.body.data[0].fechaAplicacion).toBe('2026-10-15');
    expect(res.body.data[1].fechaAplicacion).toBe('2026-11-01');
  });
});