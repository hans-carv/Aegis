// tests/gatos.spec.ts
import request from 'supertest';
import app from '../src/app';
import { closePool, pool } from '../src/config/db';

describe('SCRUM-30 / Registro único de gatos y ficha técnica', () => {
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@teocatcafe.bo', password: 'TeoCat2026*' });
    adminToken = adminRes.body.token;

    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cliente@teocatcafe.bo', password: 'TeoCat2026*' });
    userToken = userRes.body.token;

    // Limpieza previa de registros de prueba para garantizar idempotencia
    await pool.query(
      "DELETE FROM public.gatos WHERE codigo_felino IN ('TEST-001', 'TEST-CONC', 'TEST-NEG', 'TEST-ALFA')"
    );
  }, 15000);

  afterAll(async () => {
    // Limpieza de datos creados durante la ejecución
    await pool.query(
      "DELETE FROM public.gatos WHERE codigo_felino IN ('TEST-001', 'TEST-CONC', 'TEST-NEG', 'TEST-ALFA')"
    );
    await closePool();
  });

  // --- PRUEBA 1: Registro Exitoso y valores por defecto ---
  it('Registra exitosamente un felino con foto e historia y estado CUARENTENA por defecto (201 Created)', async () => {
    const res = await request(app)
      .post('/api/gatos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigoFelino: 'TEST-001',
        nombre: 'Michi Test',
        peso: 4.2,
        talla: 'Mediano',
        edadMeses: 18,
        temperamento: 'Dócil y curioso',
        colorPelaje: 'Blanco y negro',
        sexo: 'MACHO',
        fotoUrl: 'https://storage.teocatcafe.bo/cats/test-001.jpg',
        historia: 'Rescatado en buen estado de salud.',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.codigo_felino).toBe('TEST-001');
    expect(res.body.data.estado).toBe('CUARENTENA');
    expect(Number(res.body.data.peso)).toBe(4.2);
    expect(res.body.data.foto_url).toBe('https://storage.teocatcafe.bo/cats/test-001.jpg');
    expect(res.body.data.historia).toBe('Rescatado en buen estado de salud.');
  });

  // --- PRUEBA 2: Restricción de visibilidad de foto_url por Rol ---
  it('Permite ver foto_url al Administrador pero la oculta al Cliente regular (200 OK)', async () => {
    // Consulta como Admin
    const resAdmin = await request(app)
      .get('/api/gatos/TEST-001')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body.data.foto_url).toBeDefined();
    expect(resAdmin.body.data.historia).toBeDefined();

    // Consulta como Cliente
    const resCliente = await request(app)
      .get('/api/gatos/TEST-001')
      .set('Authorization', `Bearer ${userToken}`);

    expect(resCliente.status).toBe(200);
    expect(resCliente.body.data.foto_url).toBeUndefined();
    expect(resCliente.body.data.historia).toBeDefined();
  });

  // --- PRUEBA 3: Rechazo con 409 Conflict ante código duplicado ---
  it('Rechaza con 409 Conflict si se intenta registrar un felino con un código ya existente', async () => {
    const res = await request(app)
      .post('/api/gatos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigoFelino: 'TEST-001',
        nombre: 'Gato Clon',
        peso: 3.5,
        edadMeses: 12,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toContain('ya se encuentra registrado');
  });

  // --- PRUEBA 4: Inserción concurrente simultánea (DoD SCRUM-30) ---
  it('Certifica bloqueo de duplicidad ante peticiones concurrentes simultáneas', async () => {
    const payload = {
      codigoFelino: 'TEST-CONC',
      nombre: 'Michi Paralelo',
      peso: 3.0,
      edadMeses: 8,
    };

    // Disparo simultáneo de 2 requests con la misma carga útil
    const [peticion1, peticion2] = await Promise.all([
      request(app).post('/api/gatos').set('Authorization', `Bearer ${adminToken}`).send(payload),
      request(app).post('/api/gatos').set('Authorization', `Bearer ${adminToken}`).send(payload),
    ]);

    const codigosStatus = [peticion1.status, peticion2.status].sort();

    // Uno debe ser registrado (201) y el otro bloqueado por conflicto de unicidad (409)
    expect(codigosStatus).toEqual([201, 409]);
  });

  // --- PRUEBA 5: Validación de peso positivo ---
  it('Rechaza con 400 Bad Request si el peso es menor o igual a 0', async () => {
    const res = await request(app)
      .post('/api/gatos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigoFelino: 'TEST-NEG',
        nombre: 'Michi Negativo',
        peso: -1.5,
        edadMeses: 10,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('peso');
  });

  // --- PRUEBA 6: Validación de edad positiva ---
  it('Rechaza con 400 Bad Request si la edad en meses es menor o igual a 0', async () => {
    const res = await request(app)
      .post('/api/gatos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigoFelino: 'TEST-NEG',
        nombre: 'Michi Sin Edad',
        peso: 2.5,
        edadMeses: 0,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('edad');
  });

  // --- PRUEBA 7: Validación de código no alfanumérico ---
  it('Rechaza con 400 Bad Request si el código contiene caracteres no permitidos', async () => {
    const res = await request(app)
      .post('/api/gatos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        codigoFelino: 'TEO#999!*',
        nombre: 'Michi Simbolos',
        peso: 3.2,
        edadMeses: 6,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('alfanumérico');
  });

  // --- PRUEBA 8: Control de Acceso RBAC (Solo Administrador puede registrar) ---
  it('Rechaza con 403 Forbidden si un rol Cliente intenta registrar un felino', async () => {
    const res = await request(app)
      .post('/api/gatos')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        codigoFelino: 'TEST-CLI',
        nombre: 'Michi No Autorizado',
        peso: 3.0,
        edadMeses: 10,
      });

    expect(res.status).toBe(403);
  });
});