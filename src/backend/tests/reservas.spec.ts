// tests/reservas.spec.ts
import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db';

describe('HU: Reserva de turnos y control de aforo (SCRUM-49)', () => {
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';
  let user1Token: string;
  let user2Token: string;
  
  let franjaLimitadaId: string;
  let franjaBloqueadaId: string;
  const fechaFuturaLunes = '2026-11-16';

  beforeAll(async () => {
    const usuariosExistentes = await query('SELECT id FROM public.usuarios LIMIT 2');

    let user1Id: string;
    let user2Id: string;

    if (usuariosExistentes.rows.length >= 2) {
      user1Id = usuariosExistentes.rows[0].id;
      user2Id = usuariosExistentes.rows[1].id;
    } else {
      const rolRes = await query("SELECT id FROM public.roles WHERE nombre IN ('USUARIO', 'CLIENTE') LIMIT 1");
      const rolId = rolRes.rows[0]?.id;

      const nuevoUser = await query(`
        INSERT INTO public.usuarios (id, email, password, rol_id)
        VALUES 
          ('00000000-0000-0000-0000-000000000002', 'test_user1@teocat.bo', 'pass123', $1),
          ('00000000-0000-0000-0000-000000000003', 'test_user2@teocat.bo', 'pass123', $1)
        ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email
        RETURNING id;
      `, [rolId]);
      
      user1Id = '00000000-0000-0000-0000-000000000002';
      user2Id = '00000000-0000-0000-0000-000000000003';
    }

    user1Token = jwt.sign({ id: user1Id, email: 'test_user1@teocat.bo', rol: 'USUARIO' }, secret);
    user2Token = jwt.sign({ id: user2Id, email: 'test_user2@teocat.bo', rol: 'USUARIO' }, secret);

    // 2. Crear franjas horarias específicas para el test
    const resFranja = await query(`
      INSERT INTO public.franjas_horarias (dia_semana, hora_inicio, hora_fin, aforo_maximo, activo)
      VALUES ('LUNES', '15:00:00', '16:00:00', 1, TRUE)
      RETURNING id;
    `);
    franjaLimitadaId = resFranja.rows[0].id;

    const resBloqueada = await query(`
      INSERT INTO public.franjas_horarias (dia_semana, hora_inicio, hora_fin, aforo_maximo, activo, motivo_bloqueo)
      VALUES ('LUNES', '17:00:00', '18:00:00', 5, FALSE, 'Mantenimiento programado')
      RETURNING id;
    `);
    franjaBloqueadaId = resBloqueada.rows[0].id;
  });

  afterAll(async () => {
    // Limpieza de datos creados
    if (franjaLimitadaId || franjaBloqueadaId) {
      await query('DELETE FROM public.reservas_visita WHERE franja_id IN ($1, $2)', [franjaLimitadaId, franjaBloqueadaId]);
      await query('DELETE FROM public.franjas_horarias WHERE id IN ($1, $2)', [franjaLimitadaId, franjaBloqueadaId]);
    }
    await pool.end();
  });

  it('DoD 3a: Rechaza con 400 Bad Request si la fecha es en el pasado', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        franjaId: franjaLimitadaId,
        fechaReserva: '2024-01-01',
        cantidadPersonas: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/pasadas/i);
  });

  it('DoD 3b: Rechaza con 400 Bad Request si el turno está inhabilitado', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        franjaId: franjaBloqueadaId,
        fechaReserva: fechaFuturaLunes,
        cantidadPersonas: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/inhabilitado/i);
  });

  it('DoD 1: Registra reserva y retorna 201 Created si hay cupo disponible', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        franjaId: franjaLimitadaId,
        fechaReserva: fechaFuturaLunes,
        cantidadPersonas: 1,
      });

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.reserva).toHaveProperty('id');
  });

  it('DoD 4: Retorna 409 Conflict si el usuario ya tiene reserva para esa franja y fecha', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${user1Token}`)
      .send({
        franjaId: franjaLimitadaId,
        fechaReserva: fechaFuturaLunes,
        cantidadPersonas: 1,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Ya posees una reserva/i);
  });

  it('DoD 2 & SCRUM-49: Rechaza con 409 Conflict si se excede el aforo máximo', async () => {
    const res = await request(app)
      .post('/api/reservas')
      .set('Authorization', `Bearer ${user2Token}`)
      .send({
        franjaId: franjaLimitadaId,
        fechaReserva: fechaFuturaLunes,
        cantidadPersonas: 1,
      });

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/Capacidad máxima alcanzada/i);
  });
});