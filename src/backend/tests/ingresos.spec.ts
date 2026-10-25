// tests/ingresos.spec.ts
import request from 'supertest';
import app from '../src/app';
import { closePool } from '../src/config/db';

describe('SCRUM-19 / Registro de ingreso de gatos y vía de llegada', () => {
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {
    // 1. Obtener token de Administradora (Gisel)
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@teocatcafe.bo', password: 'TeoCat2026*' });
    adminToken = adminRes.body.token;

    // 2. Obtener token de Usuario regular
    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cliente@ucb.edu.bo', password: 'TeoCat2026*' });
    userToken = userRes.body.token;
  }, 15000);

  afterAll(async () => {
    await closePool();
  });

  it('Rechaza con 400 Bad Request si no se envía la vía de procedencia', async () => {
    const res = await request(app)
      .post('/api/ingresos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombreGato: 'Michi Solitario',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('vía de procedencia es obligatoria');
  });

  it('Rechaza con 400 Bad Request si la procedencia es FUNDACION pero falta la institución', async () => {
    const res = await request(app)
      .post('/api/ingresos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombreGato: 'Pelusa',
        viaProcedencia: 'FUNDACION',
        fechaDerivacion: '2026-10-25',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('nombre de la institución es obligatorio');
  });

  it('Rechaza con 400 Bad Request si la procedencia es FUNDACION pero falta la fecha de derivación', async () => {
    const res = await request(app)
      .post('/api/ingresos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombreGato: 'Pelusa',
        viaProcedencia: 'FUNDACION',
        nombreInstitucion: 'Fundación Animales SOS',
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('fecha de derivación es obligatoria');
  });

  it('Registra exitosamente un felino RESCATADO sin exigir campos de fundación (201 Created)', async () => {
    const res = await request(app)
      .post('/api/ingresos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombreGato: 'Simba',
        edadMeses: 10,
        sexo: 'MACHO',
        colorPelaje: 'Naranja atigrado',
        viaProcedencia: 'RESCATADO',
        observaciones: 'Rescatado en la plaza',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('id');
    expect(res.body.data.via_procedencia).toBe('RESCATADO');
    expect(res.body.data).toHaveProperty('created_at');
    expect(res.body.data).toHaveProperty('created_by');
  });

  it('Registra exitosamente un felino por FUNDACION con todos los datos (201 Created)', async () => {
    const res = await request(app)
      .post('/api/ingresos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nombreGato: 'Luna',
        edadMeses: 8,
        sexo: 'HEMBRA',
        colorPelaje: 'Blanco',
        viaProcedencia: 'FUNDACION',
        nombreInstitucion: 'Fundación La Paz Gatuna',
        fechaDerivacion: '2026-10-20',
        observaciones: 'Vacunas y desparasitación al día',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('via_procedencia');
    expect(res.body.data.via_procedencia).toBe('FUNDACION');
    expect(res.body.data.nombre_institucion).toBe('Fundación La Paz Gatuna');
    expect(res.body.data).toHaveProperty('created_by');
  });

  it('Rechaza con 403 Forbidden si un usuario no administrador intenta registrar el ingreso', async () => {
    const res = await request(app)
      .post('/api/ingresos')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        nombreGato: 'Michi Intruso',
        viaProcedencia: 'PARTICULAR',
      });

    expect(res.status).toBe(403);
  });
});