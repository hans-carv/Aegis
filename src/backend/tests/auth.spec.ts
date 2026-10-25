// tests/auth.spec.ts
import request from 'supertest';
import app from '../src/app';
import { closePool } from '../src/config/db';

describe('SCRUM-12 / Control de Acceso y Autenticación RBAC', () => {
  let adminToken = '';
  let userToken = '';

  afterAll(async () => {
    await closePool();
  });

  it('DoD #1: Retorna 200 OK con token JWT y datos de sesión al ingresar credenciales válidas', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@teocatcafe.bo', password: 'TeoCat2026*' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.rol).toBe('ADMIN');
    expect(res.body.user.nombre).toContain('Gisel');

    adminToken = res.body.token;
  });

  it('DoD #2: Retorna 401 Unauthorized sin revelar si falló el correo o la contraseña', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@teocatcafe.bo', password: 'ClaveIncorrecta' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciales inválidas.');
  });

  it('DoD #3: Retorna 401 Unauthorized al consumir rutas privadas sin token', async () => {
    const res = await request(app).get('/api/auth/perfil');
    expect(res.status).toBe(401);
  });

  it('DoD #4: Retorna 403 Forbidden cuando un usuario común intenta acceder a una ruta de admin', async () => {
    // Usamos el correo real de tu base de datos: cliente@ucb.edu.bo
    const loginUser = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cliente@ucb.edu.bo', password: 'TeoCat2026*' });

    expect(loginUser.status).toBe(200);
    userToken = loginUser.body.token;

    const res = await request(app)
      .get('/api/auth/admin-only')
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('Permite acceso a admin-only cuando el token tiene rol ADMIN (200 OK)', async () => {
    const res = await request(app)
      .get('/api/auth/admin-only')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
  });
});