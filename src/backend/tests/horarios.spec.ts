// tests/horarios.test.ts
import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { query } from '../src/config/db';

describe('HU: Configuración administrativa de horarios y aforo (SCRUM-42)', () => {
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';
  let adminToken: string;
  let userToken: string;
  let franjaCreadaId: string;

  beforeAll(async () => {
    // Generación de tokens directos con payload compatible con tu UserSessionPayload
    adminToken = jwt.sign(
      {
        id: '11111111-1111-1111-1111-111111111111',
        email: 'admin@teocatcafe.bo',
        rol: 'ADMIN',
      },
      secret,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      {
        id: '22222222-2222-2222-2222-222222222222',
        email: 'cliente@test.com',
        rol: 'USUARIO',
      },
      secret,
      { expiresIn: '1h' }
    );

    // Limpieza de datos de prueba previos para el día de test
    await query("DELETE FROM public.franjas_horarias WHERE dia_semana = 'LUNES'");
  });

  afterAll(async () => {
    // Limpieza posterior de los registros creados durante la prueba
    if (franjaCreadaId) {
      await query('DELETE FROM public.franjas_horarias WHERE id = $1', [franjaCreadaId]);
    }
  });

  // Criterio 1: Parámetros válidos -> 201 Created
  it('DoD 1: Debe crear una franja horaria válida y retornar 201 Created', async () => {
    const res = await request(app)
      .post('/api/admin/horarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        diaSemana: 'LUNES',
        horaInicio: '08:00',
        horaFin: '10:00',
        aforoMaximo: 10,
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.aforoMaximo).toBe(10);
    expect(res.body.data.activo).toBe(true);

    franjaCreadaId = res.body.data.id;
  });

  // Criterio 2: Solapamiento horario en el mismo día -> 409 Conflict
  it('DoD 2: Debe rechazar con 409 Conflict si el horario se solapa con uno existente', async () => {
    const res = await request(app)
      .post('/api/admin/horarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        diaSemana: 'LUNES',
        horaInicio: '09:00', // Colisiona con el rango 08:00 - 10:00
        horaFin: '11:00',
        aforoMaximo: 8,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/solapa|cruza/i);
  });

  // Criterio 3: Acceso no autorizado (rol USUARIO) -> 403 Forbidden
  it('DoD 3: Debe retornar 403 Forbidden si un rol USUARIO intenta crear franjas', async () => {
    const res = await request(app)
      .post('/api/admin/horarios')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        diaSemana: 'LUNES',
        horaInicio: '14:00',
        horaFin: '16:00',
        aforoMaximo: 5,
      });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Acceso prohibido/i);
  });

  // Criterio 4: Deshabilitar o bloquear una franja -> 200 OK
  it('DoD 4: Debe permitir bloquear o deshabilitar una franja existente retornando 200 OK', async () => {
    const res = await request(app)
      .put(`/api/admin/horarios/${franjaCreadaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        activo: false,
        motivoBloqueo: 'Mantenimiento del área de gateras',
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.activo).toBe(false);
    expect(res.body.data.motivoBloqueo).toBe('Mantenimiento del área de gateras');
  });
});