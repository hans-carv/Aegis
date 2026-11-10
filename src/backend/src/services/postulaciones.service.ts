import { pool, query } from '../config/db';
import { CreatePostulacionDto } from '../dtos/postulacion.dto';

export class PostulacionesService {
  /**
   * HU: Registro inmutable de postulación de adopción
   */
  static async crearPostulacion(usuarioId: string, dto: CreatePostulacionDto) {
    const { gatoId, presupuestoMensual, telefonoContacto, direccionDomicilio, cuestionario } = dto;

    if (
      !gatoId ||
      !presupuestoMensual ||
      !telefonoContacto ||
      !direccionDomicilio ||
      !cuestionario ||
      typeof cuestionario.tieneMallasProteccion !== 'boolean' ||
      typeof cuestionario.permisoPropietario !== 'boolean' ||
      typeof cuestionario.compromisoTenenciaResponsable !== 'boolean'
    ) {
      throw {
        status: 400,
        message: 'Faltan respuestas obligatorias sobre seguridad del hogar (mallas de protección, permiso de propietario, tenencia responsable).',
      };
    }

    if (presupuestoMensual <= 0) {
      throw { status: 400, message: 'El presupuesto mensual debe ser mayor a 0.' };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Consultar usando la columna 'estado' existente en public.gatos
      const gatoRes = await client.query(
        'SELECT id, nombre, estado FROM public.gatos WHERE id = $1 FOR UPDATE',
        [gatoId]
      );

      if (gatoRes.rows.length === 0) {
        throw { status: 404, message: 'El felino seleccionado no existe.' };
      }

      const gato = gatoRes.rows[0];
      const estadoGato = String(gato.estado).trim().toUpperCase();

      // Criterio de exclusión: Únicamente puede postularse si está DISPONIBLE
      if (estadoGato !== 'DISPONIBLE') {
        throw {
          status: 409,
          message: `El felino ${gato.nombre} no se encuentra disponible (estado actual: ${estadoGato}).`,
        };
      }

      const insertSql = `
        INSERT INTO public.postulaciones_adopcion 
          (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio)
        VALUES ($1, $2, 'EN_REVISION', $3, $4, $5, $6)
        RETURNING 
          id, 
          usuario_id AS "usuarioId", 
          gato_id AS "gatoId", 
          estado, 
          cuestionario_vivienda AS "cuestionario", 
          presupuesto_mensual AS "presupuestoMensual", 
          telefono_contacto AS "telefonoContacto", 
          direccion_domicilio AS "direccionDomicilio", 
          created_at AS "createdAt";
      `;

      const insertRes = await client.query(insertSql, [
        usuarioId,
        gatoId,
        JSON.stringify(cuestionario),
        presupuestoMensual,
        telefonoContacto,
        direccionDomicilio,
      ]);

      await client.query('COMMIT');
      return insertRes.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async rechazarModificacionInmutable() {
    throw {
      status: 403,
      message: 'Operación denegada: Las postulaciones de adopción enviadas son inmutables y no admiten modificaciones.',
    };
  }

  static async listarPostulacionesAdmin(filtros: { gatoId?: string; fecha?: string }) {
    let sql = `
      SELECT 
        p.id,
        p.estado,
        p.presupuesto_mensual AS "presupuestoMensual",
        p.telefono_contacto AS "telefonoContacto",
        p.direccion_domicilio AS "direccionDomicilio",
        p.cuestionario_vivienda AS "cuestionario",
        p.created_at AS "createdAt",
        u.nombre_completo AS "postulanteNombre",
        u.email AS "postulanteEmail",
        g.nombre AS "gatoNombre",
        g.id AS "gatoId"
      FROM public.postulaciones_adopcion p
      JOIN public.usuarios u ON p.usuario_id = u.id
      JOIN public.gatos g ON p.gato_id = g.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filtros.gatoId) {
      params.push(filtros.gatoId);
      sql += ` AND p.gato_id = $${params.length}`;
    }

    if (filtros.fecha) {
      params.push(filtros.fecha);
      sql += ` AND p.created_at::date = $${params.length}::date`;
    }

    sql += ' ORDER BY p.created_at DESC;';

    const res = await query(sql, params);
    return res.rows;
  }

  /**
   * SCRUM-62: Cancelación voluntaria o administrativa con motivo obligatorio y liberación atómica del gato
   */
  static async cancelarPostulacion(
    postulacionId: string,
    usuarioId: string,
    rolUsuario: string | undefined,
    motivo: string
  ) {
    // DoD 2: Rechazo si se omite el motivo
    if (!motivo || typeof motivo !== 'string' || motivo.trim().length === 0) {
      throw {
        status: 400,
        message: 'Debe indicar obligatoriamente el motivo de cancelación de la solicitud.',
      };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const postRes = await client.query(
        'SELECT id, usuario_id, gato_id, estado FROM public.postulaciones_adopcion WHERE id = $1 FOR UPDATE',
        [postulacionId]
      );

      if (postRes.rows.length === 0) {
        throw { status: 404, message: 'La postulación no existe.' };
      }

      const post = postRes.rows[0];

      // DoD 4: El usuario solo puede cancelar sus postulaciones, a menos que sea ADMIN
      if (rolUsuario !== 'ADMIN' && post.usuario_id !== usuarioId) {
        throw {
          status: 403,
          message: 'Acceso denegado: No tienes autorización para cancelar la postulación de otro usuario.',
        };
      }

      // DoD 3: No se puede cancelar si ya fue aprobada o tiene contrato firmado
      const estadoPost = String(post.estado).toUpperCase();
      if (estadoPost === 'APROBADA' || estadoPost === 'APROBADA_FINALIZADA') {
        throw {
          status: 409,
          message: 'Conflicto: No se puede cancelar una postulación que ya cuenta con contrato firmado o ha sido formalmente aprobada.',
        };
      }

      if (estadoPost === 'CANCELADA') {
        throw {
          status: 400,
          message: 'La postulación ya se encuentra en estado CANCELADA.',
        };
      }

      // 1. Cancelar postulación registrando auditoría (SCRUM-64)
      const updatePostSql = `
        UPDATE public.postulaciones_adopcion
        SET 
          estado = 'CANCELADA',
          motivo_baja = $1,
          cancelado_por = $2,
          fecha_baja = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, estado, motivo_baja, cancelado_por, fecha_baja;
      `;
      const updatedPostRes = await client.query(updatePostSql, [motivo.trim(), usuarioId, postulacionId]);

      // 2. Liberación inmediata del felino a estado DISPONIBLE
      await client.query(
        "UPDATE public.gatos SET estado = 'DISPONIBLE' WHERE id = $1",
        [post.gato_id]
      );

      await client.query('COMMIT');

      return {
        postulacion: updatedPostRes.rows[0],
        gatoLiberadoId: post.gato_id,
        mensaje: 'Postulación cancelada con éxito y felino retornado al catálogo disponible.',
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}