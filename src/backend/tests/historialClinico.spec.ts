import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db';
import crypto from 'crypto';

describe('HU: Gestión de estado de castración, diagnósticos y tratamientos activos (SCRUM-76)', () => {
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';
  let userToken: string;
  let adminToken: string;
  let gatoId: string;

  beforeAll(async () => {
    const userRes = await query('SELECT id FROM public.usuarios LIMIT 1');
    const userId = userRes.rows[0]?.id;

    userToken = jwt.sign({ id: userId, email: 'postulante@teocat.bo', rol: 'USUARIO' }, secret);
    adminToken = jwt.sign({ id: userId, email: 'admin@teocat.bo', rol: 'ADMIN' }, secret);

    // Crear gato inicialmente DISPONIBLE y sin esterilizar
    const gatoRes = await query(`
      INSERT INTO public.gatos (nombre, codigo_felino, estado, esterilizado, estado_medico)
      VALUES ('Oreo Clínico', 'HC-TEST-${Date.now()}', 'DISPONIBLE', FALSE, 'SANO')
      RETURNING id;
    `);
    gatoId = gatoRes.rows[0].id;
  });

  afterAll(async () => {
    if (gatoId) {
      await query('DELETE FROM public.tratamientos_clinicos WHERE gato_id = $1', [gatoId]);
      await query('DELETE FROM public.gatos WHERE id = $1', [gatoId]);
    }
    await pool.end();
  });

  // Seguridad: Acceso exclusivo ADMIN
  it('Seguridad: Debe retornar 403 Forbidden si un usuario sin rol ADMIN intenta registrar o leer el expediente clínico', async () => {
    const res = await request(app)
      .post(`/api/admin/cats/${gatoId}/historial-clinico`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        tipoProcedimiento: 'CASTRACION',
        diagnostico: 'Apto para cirugía',
        descripcionTratamiento: 'Ovariohisterectomía',
        veterinarioResponsable: 'Dr. Carlos Méndez',
      });

    expect(res.status).toBe(403);
  });

  // DoD 3: 404 Not Found para ID inexistente
  it('DoD 3: Debe retornar 404 Not Found al registrar un procedimiento sobre un ID de felino inexistente', async () => {
    const fakeUuid = crypto.randomUUID();
    const res = await request(app)
      .post(`/api/admin/cats/${fakeUuid}/historial-clinico`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipoProcedimiento: 'PRUEBA_VIRAL',
        diagnostico: 'Chequeo de ingreso',
        descripcionTratamiento: 'Test rápido ELISA VIF/ViLeF',
        resultadoVif: 'NEGATIVO',
        resultadoVilef: 'NEGATIVO',
        veterinarioResponsable: 'Dra. Laura Paz',
      });

    expect(res.status).toBe(404);
  });

  // DoD 1 & DoD 4: Registro de castración/pruebas virales, actualización de esterilizado y auditoría (201 Created)
  it('DoD 1 y 4: Registra castración y pruebas virales (201 Created), actualiza esterilizado=true y almacena fecha y veterinario', async () => {
    const res = await request(app)
      .post(`/api/admin/cats/${gatoId}/historial-clinico`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipoProcedimiento: 'CASTRACION',
        diagnostico: 'Paciente sano para esterilización programada',
        descripcionTratamiento: 'Orquiectomía bilateral + Test VIF/ViLeF',
        esEsterilizacion: true,
        resultadoVif: 'NEGATIVO',
        resultadoVilef: 'NEGATIVO',
        estadoMedico: 'SANO',
        veterinarioResponsable: 'Dr. Andrés Villarroel',
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.estadoFelinoActualizado.esterilizado).toBe(true);
    expect(res.body.data.estadoFelinoActualizado.resultadoVif).toBe('NEGATIVO');
    expect(res.body.data.registroClinico.veterinarioResponsable).toBe('Dr. Andrés Villarroel');
    expect(res.body.data.registroClinico.fechaRegistro).toBeDefined();
  });

  // DoD 2 & SCRUM-76: Tratamiento crítico / EN_TRATAMIENTO oculta automáticamente al felino del catálogo público
  it('DoD 2 y SCRUM-76: Al marcar estadoMedico en EN_TRATAMIENTO, cambia disponibilidad a CUARENTENA y desaparece de GET /api/public/cats', async () => {
    // Confirmar que antes del tratamiento sí aparece en el catálogo público
    const publicAntes = await request(app).get('/api/public/cats');
    const listaAntes = Array.isArray(publicAntes.body.data) ? publicAntes.body.data : publicAntes.body;
    expect(listaAntes.some((g: any) => g.id === gatoId)).toBe(true);

    // Registrar tratamiento crítico / aislamiento
    const resTratamiento = await request(app)
      .post(`/api/admin/cats/${gatoId}/historial-clinico`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        tipoProcedimiento: 'TRATAMIENTO_FARMACOLOGICO',
        diagnostico: 'Rinotraqueitis infecciosa felina aguda',
        descripcionTratamiento: 'Doxiciclina 10mg/kg cada 24h por 14 días + aislamiento respiratorio',
        estadoMedico: 'EN_TRATAMIENTO',
        requiereAislamientoOCritico: true,
        veterinarioResponsable: 'Dra. Camila Rojas',
      });

    expect(resTratamiento.status).toBe(201);
    expect(resTratamiento.body.data.estadoFelinoActualizado.estadoMedico).toBe('EN_TRATAMIENTO');
    expect(resTratamiento.body.data.estadoFelinoActualizado.estado).toBe('CUARENTENA');

    // Confirmar que desapareció automáticamente del catálogo público
    const publicDespues = await request(app).get('/api/public/cats');
    const listaDespues = Array.isArray(publicDespues.body.data) ? publicDespues.body.data : publicDespues.body;
    expect(listaDespues.some((g: any) => g.id === gatoId)).toBe(false);
  });
});