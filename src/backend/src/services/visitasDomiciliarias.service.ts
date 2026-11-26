import { pool, query } from '../config/db';

export interface CreateVisitaDomiciliariaDto {
  postulacionId: string;
  evaluadorId?: string;
  fechaVisita: string;
  horaInicio: string;
  horaFin: string;
  direccionConfirmada?: string;
  observaciones?: string;
}

export class VisitasDomiciliariasService {
  static async agendarVisita(adminId: string, dto: CreateVisitaDomiciliariaDto) {
    const {
      postulacionId,
      evaluadorId,
      fechaVisita,
      horaInicio,
      horaFin,
      direccionConfirmada,
      observaciones,
    } = dto;

    if (!postulacionId || !fechaVisita || !horaInicio || !horaFin) {
      throw {
        status: 400,
        message: 'Los campos postulacionId, fechaVisita, horaInicio y horaFin son obligatorios.',
      };
    }

    if (horaFin <= horaInicio) {
      throw {
        status: 400,
        message: 'La hora de finalización debe ser posterior a la hora de inicio.',
      };
    }

    const evaluadorAsignado = evaluadorId || adminId;
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const postRes = await client.query(
        'SELECT id, estado, direccion_domicilio, documentacion_completa FROM public.postulaciones_adopcion WHERE id = $1 FOR UPDATE',
        [postulacionId]
      );

      if (postRes.rows.length === 0) {
        throw { status: 404, message: 'La postulación especificada no existe.' };
      }

      const postulacion = postRes.rows[0];
      if (postulacion.estado === 'CANCELADA' || postulacion.estado === 'RECHAZADA') {
        throw {
          status: 409,
          message: `No se puede agendar una visita para una postulación en estado ${postulacion.estado}.`,
        };
      }

      const docsRes = await client.query(
        `SELECT COUNT(DISTINCT tipo_documento)::int AS total
         FROM public.documentos_postulacion
         WHERE postulacion_id = $1
           AND tipo_documento IN ('CARNET_IDENTIDAD', 'FACTURA_SERVICIO', 'CROQUIS_DOMICILIO')`,
        [postulacionId]
      );

      const totalDocs = docsRes.rows[0]?.total || 0;
      if (totalDocs < 3 && !postulacion.documentacion_completa) {
        throw {
          status: 400,
          message: `Precondición documental incompleta: se requieren los 3 documentos obligatorios (Carnet de Identidad, Factura de Servicio y Croquis) antes de agendar la visita (actuales: ${totalDocs}/3).`,
        };
      }

      const colisionVisitaSql = `
        SELECT id, hora_inicio, hora_fin
        FROM public.visitas_domiciliarias
        WHERE fecha_visita = $1::date
          AND estado = 'PROGRAMADA'
          AND (evaluador_id = $2 OR true)
          AND (hora_inicio < $4::time AND hora_fin > $3::time)
        LIMIT 1;
      `;
      const colisionVisitaRes = await client.query(colisionVisitaSql, [
        fechaVisita,
        evaluadorAsignado,
        horaInicio,
        horaFin,
      ]);

      if (colisionVisitaRes.rows.length > 0) {
        throw {
          status: 409,
          message: `Conflicto de agenda: ya existe una visita domiciliaria programada el ${fechaVisita} entre ${colisionVisitaRes.rows[0].hora_inicio} y ${colisionVisitaRes.rows[0].hora_fin}.`,
        };
      }

      const checkReservasTable = await client.query(
        `SELECT to_regclass('public.reservas') AS tabla`
      );
      if (checkReservasTable.rows[0]?.tabla) {
        try {
          const colisionCafeRes = await client.query(
            `SELECT id FROM public.reservas
             WHERE fecha = $1::date
               AND estado NOT IN ('CANCELADA')
               AND (hora_inicio < $3::time AND hora_fin > $2::time)
             LIMIT 1`,
            [fechaVisita, horaInicio, horaFin]
          );
          if (colisionCafeRes.rows.length > 0) {
            throw {
              status: 409,
              message: 'Conflicto de agenda: el horario seleccionado se cruza con un turno/reserva activa en la cafetería.',
            };
          }
        } catch (err: any) {
          if (err.status === 409) throw err;
        }
      }

      const insertVisitaSql = `
        INSERT INTO public.visitas_domiciliarias (
          postulacion_id,
          evaluador_id,
          fecha_visita,
          hora_inicio,
          hora_fin,
          direccion_confirmada,
          observaciones,
          estado
        )
        VALUES ($1, $2, $3::date, $4::time, $5::time, $6, $7, 'PROGRAMADA')
        RETURNING 
          id,
          postulacion_id AS "postulacionId",
          evaluador_id AS "evaluadorId",
          to_char(fecha_visita, 'YYYY-MM-DD') AS "fechaVisita",
          to_char(hora_inicio, 'HH24:MI') AS "horaInicio",
          to_char(hora_fin, 'HH24:MI') AS "horaFin",
          direccion_confirmada AS "direccionConfirmada",
          observaciones,
          estado,
          created_at AS "createdAt";
      `;

      const visitaRes = await client.query(insertVisitaSql, [
        postulacionId,
        evaluadorAsignado,
        fechaVisita,
        horaInicio,
        horaFin,
        (direccionConfirmada || postulacion.direccion_domicilio || 'Dirección registrada en postulación').trim(),
        observaciones || null,
      ]);

      const updatePostRes = await client.query(
        `UPDATE public.postulaciones_adopcion
         SET estado = 'VISITA_PROGRAMADA', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, estado`,
        [postulacionId]
      );

      await client.query('COMMIT');

      return {
        visita: visitaRes.rows[0],
        postulacion: updatePostRes.rows[0],
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async listarAgendaVisitas(fecha?: string) {
    let sql = `
      SELECT 
        v.id,
        v.postulacion_id AS "postulacionId",
        to_char(v.fecha_visita, 'YYYY-MM-DD') AS "fechaVisita",
        to_char(v.hora_inicio, 'HH24:MI') AS "horaInicio",
        to_char(v.hora_fin, 'HH24:MI') AS "horaFin",
        v.direccion_confirmada AS "direccionConfirmada",
        v.estado,
        u.nombre_completo AS "postulanteNombre",
        g.nombre AS "gatoNombre"
      FROM public.visitas_domiciliarias v
      JOIN public.postulaciones_adopcion p ON v.postulacion_id = p.id
      JOIN public.usuarios u ON p.usuario_id = u.id
      JOIN public.gatos g ON p.gato_id = g.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (fecha) {
      params.push(fecha);
      sql += ` AND v.fecha_visita = $${params.length}::date`;
    }

    sql += ' ORDER BY v.fecha_visita ASC, v.hora_inicio ASC';

    const res = await query(sql, params);
    return res.rows;
  }
}