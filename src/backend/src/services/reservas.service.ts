import { pool } from '../config/db';
import { CreateReservaDto, DisponibilidadResponseDto } from '../dtos/reserva.dto';

export class ReservasService {
  static async consultarDisponibilidad(fecha: string): Promise<DisponibilidadResponseDto[]> {
    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(fecha)) {
      throw { status: 400, message: 'Formato de fecha inválido. Utilice YYYY-MM-DD.' };
    }

    const sql = `
      SELECT 
        f.id AS "franjaId",
        f.dia_semana AS "diaSemana",
        f.hora_inicio AS "horaInicio",
        f.hora_fin AS "horaFin",
        f.aforo_maximo AS "aforoMaximo",
        f.activo,
        f.motivo_bloqueo AS "motivoBloqueo",
        COALESCE(SUM(r.cantidad_personas), 0)::int AS "cuposOcupados"
      FROM public.franjas_horarias f
      LEFT JOIN public.reservas_visita r 
        ON f.id = r.franja_id 
        AND r.fecha_reserva = $1::date 
        AND r.estado = 'CONFIRMADA'
      WHERE f.dia_semana = (
        CASE EXTRACT(ISODOW FROM $1::date)
          WHEN 1 THEN 'LUNES'
          WHEN 2 THEN 'MARTES'
          WHEN 3 THEN 'MIERCOLES'
          WHEN 4 THEN 'JUEVES'
          WHEN 5 THEN 'VIERNES'
          WHEN 6 THEN 'SABADO'
          WHEN 7 THEN 'DOMINGO'
        END
      )
      GROUP BY f.id
      ORDER BY f.hora_inicio ASC;
    `;

    const client = await pool.connect();
    try {
      const res = await client.query(sql, [fecha]);
      return res.rows.map((row: any) => {
        const disponibles = Math.max(0, row.aforoMaximo - row.cuposOcupados);
        return {
          ...row,
          cuposDisponibles: disponibles,
          disponible: row.activo && disponibles > 0,
        };
      });
    } finally {
      client.release();
    }
  }

  static async crearReserva(usuarioId: string, dto: CreateReservaDto) {
    const { franjaId, fechaReserva, cantidadPersonas = 1 } = dto;

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaObj = new Date(`${fechaReserva}T00:00:00`);

    if (isNaN(fechaObj.getTime()) || fechaObj < hoy) {
      throw { status: 400, message: 'No se pueden realizar reservas para fechas pasadas.' };
    }

    if (cantidadPersonas <= 0) {
      throw { status: 400, message: 'La cantidad de personas debe ser mayor a 0.' };
    }

    const client = await pool.connect();

    try {
      await client.query('BEGIN');
      const reservaPrevia = await client.query(
        `SELECT id FROM public.reservas_visita 
         WHERE usuario_id = $1 AND franja_id = $2 AND fecha_reserva = $3::date AND estado = 'CONFIRMADA'`,
        [usuarioId, franjaId, fechaReserva]
      );

      if (reservaPrevia.rows.length > 0) {
        throw {
          status: 409,
          message: 'Ya posees una reserva activa para este mismo turno y fecha.',
        };
      }

      const franjaRes = await client.query(
        `SELECT id, dia_semana, aforo_maximo, activo, motivo_bloqueo 
         FROM public.franjas_horarias 
         WHERE id = $1 FOR UPDATE`,
        [franjaId]
      );

      if (franjaRes.rows.length === 0) {
        throw { status: 404, message: 'Franja horaria no encontrada.' };
      }

      const franja = franjaRes.rows[0];

      if (!franja.activo) {
        throw {
          status: 400,
          message: `El turno seleccionado está inhabilitado: ${franja.motivo_bloqueo || 'Mantenimiento'}.`,
        };
      }

      const cuposRes = await client.query(
        `SELECT COALESCE(SUM(cantidad_personas), 0)::int AS ocupados 
         FROM public.reservas_visita 
         WHERE franja_id = $1 AND fecha_reserva = $2::date AND estado = 'CONFIRMADA'`,
        [franjaId, fechaReserva]
      );

      const ocupados = cuposRes.rows[0].ocupados;
      const cuposRestantes = franja.aforo_maximo - ocupados;

      if (cuposRestantes < cantidadPersonas) {
        throw {
          status: 409,
          message: `Capacidad máxima alcanzada. Cupos restantes: ${cuposRestantes}. Solicitados: ${cantidadPersonas}.`,
        };
      }

      const insertRes = await client.query(
        `INSERT INTO public.reservas_visita (usuario_id, franja_id, fecha_reserva, cantidad_personas, estado)
         VALUES ($1, $2, $3::date, $4, 'CONFIRMADA')
         RETURNING id, usuario_id AS "usuarioId", franja_id AS "franjaId", fecha_reserva AS "fechaReserva", cantidad_personas AS "cantidadPersonas", estado, created_at AS "createdAt"`,
        [usuarioId, franjaId, fechaReserva, cantidadPersonas]
      );

      await client.query('COMMIT');

      return {
        reserva: insertRes.rows[0],
        cuposRestantesDespuesDeReserva: cuposRestantes - cantidadPersonas,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async listarMisReservas(usuarioId: string) {
    const sql = `
      SELECT 
        r.id,
        r.fecha_reserva AS "fechaReserva",
        r.cantidad_personas AS "cantidadPersonas",
        r.estado,
        f.hora_inicio AS "horaInicio",
        f.hora_fin AS "horaFin",
        f.dia_semana AS "diaSemana"
      FROM public.reservas_visita r
      JOIN public.franjas_horarias f ON r.franja_id = f.id
      WHERE r.usuario_id = $1
      ORDER BY r.fecha_reserva DESC, f.hora_inicio ASC;
    `;
    const client = await pool.connect();
    try {
      const res = await client.query(sql, [usuarioId]);
      return res.rows;
    } finally {
      client.release();
    }
  }
}