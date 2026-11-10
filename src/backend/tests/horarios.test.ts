import request from 'supertest';
import app from '../src/app';

describe('HU: Configuración de Franjas Horarias y Aforo', () => {
  let adminToken: string;
  let userToken: string;
  let franjaCreadaId: string;

  beforeAll(async () => {
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'admin@teocatcafe.bo',
      password: 'Password123*',
    });
    adminToken = adminLogin.body.token || adminLogin.body.data?.token;

    const userLogin = await request(app).post('/api/auth/login').send({
      email: 'cliente@test.com',
      password: 'Password123*',
    });
    userToken = userLogin.body.token || userLogin.body.data?.token;
  });

  it('Debe crear una franja válida retornando 201 Created', async () => {
    const res = await request(app)
      .post('/api/admin/horarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        diaSemana: 'LUNES',
        horaInicio: '09:00',
        horaFin: '11:00',
        aforoMaximo: 8,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    franjaCreadaId = res.body.data.id;
  });

  it('Debe rechazar con 409 Conflict si se solapa con una existente', async () => {
    const res = await request(app)
      .post('/api/admin/horarios')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        diaSemana: 'LUNES',
        horaInicio: '10:00',
        horaFin: '12:00',
        aforoMaximo: 6,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('solapa');
  });

  it('Debe retornar 403 Forbidden si un rol USUARIO intenta crear horarios', async () => {
    const res = await request(app)
      .post('/api/admin/horarios')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        diaSemana: 'MARTES',
        horaInicio: '14:00',
        horaFin: '16:00',
        aforoMaximo: 5,
      });

    expect(res.status).toBe(403);
  });

  it('Debe permitir bloquear una franja retornando 200 OK', async () => {
    const res = await request(app)
      .put(`/api/admin/horarios/${franjaCreadaId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        activo: false,
        motivoBloqueo: 'Mantenimiento del área de gateras',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.activo).toBe(false);
  });
});