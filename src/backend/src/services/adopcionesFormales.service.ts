import { pool, query } from '../config/db';

export interface VincularAdopcionDto {
  postulacionId: string;
  observacionesEntrega?: string;
}

export class AdopcionesFormalesService {

  static async vincularAdoptanteYFelino(adminId: string, dto: VincularAdopcionDto) {
    const { postulacionId, observacionesEntrega } = dto;

    if (!postulacionId) {
      throw { status: 400, message: 'El campo postulacionId es obligatorio.' };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const postRes = await client.query(
        `SELECT 
           p.id AS postulacion_id,
           p.usuario_id AS adoptante_id,
           p.gato_id,
           p.estado AS estado_postulacion,
           p.direccion_domicilio,
           p.telefono_contacto,
           g.nombre AS gato_nombre,
           g.estado AS estado_gato,
           (
             SELECT v.dictamen
             FROM public.visitas_domiciliarias v
             WHERE v.postulacion_id = p.id
             ORDER BY v.created_at DESC
             LIMIT 1
           ) AS dictamen_visita
         FROM public.postulaciones_adopcion p
         JOIN public.gatos g ON p.gato_id = g.id
         WHERE p.id = $1
         FOR UPDATE OF p, g`,
        [postulacionId]
      );

      if (postRes.rows.length === 0) {
        throw { status: 404, message: 'La postulación especificada no existe.' };
      }

      const data = postRes.rows[0];

      if (data.estado_gato === 'ADOPTADO') {
        throw {
          status: 409,
          message: `Conflicto de integridad: el felino '${data.gato_nombre}' ya se encuentra en estado ADOPTADO.`,
        };
      }

      const vinculoPrevioRes = await client.query(
        `SELECT id FROM public.adopciones_formales
         WHERE gato_id = $1 AND estado_vinculo = 'VIGENTE'
         LIMIT 1`,
        [data.gato_id]
      );

      if (vinculoPrevioRes.rows.length > 0) {
        throw {
          status: 409,
          message: `Conflicto de unicidad: el felino '${data.gato_nombre}' ya posee un vínculo de adopción vigente.`,
        };
      }

      if (data.estado_postulacion !== 'APROBADA' || data.dictamen_visita !== 'APROBADA') {
        throw {
          status: 409,
          message: `No se puede formalizar la adopción: la postulación debe estar en estado APROBADA con dictamen domiciliario APROBADA (actual: postulación='${data.estado_postulacion}', dictamen='${data.dictamen_visita || 'SIN_DICTAMEN'}').`,
        };
      }

      const insertSql = `
        INSERT INTO public.adopciones_formales (
          postulacion_id,
          gato_id,
          adoptante_id,
          administrador_id,
          direccion_tenencia,
          telefono_tenencia,
          observaciones_entrega,
          estado_vinculo
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'VIGENTE')
        RETURNING 
          id,
          postulacion_id AS "postulacionId",
          gato_id AS "gatoId",
          adoptante_id AS "adoptanteId",
          administrador_id AS "administradorId",
          direccion_tenencia AS "direccionTenencia",
          telefono_tenencia AS "telefonoTenencia",
          observaciones_entrega AS "observacionesEntrega",
          estado_vinculo AS "estadoVinculo",
          fecha_adopcion AS "fechaAdopcion";
      `;

      const vinculoRes = await client.query(insertSql, [
        postulacionId,
        data.gato_id,
        data.adoptante_id,
        adminId,
        data.direccion_domicilio || 'Dirección registrada en expediente',
        data.telefono_contacto || 'Sin teléfono registrado',
        observacionesEntrega || null,
      ]);

      const updateGatoRes = await client.query(
        `UPDATE public.gatos
         SET estado = 'ADOPTADO'
         WHERE id = $1
         RETURNING id, nombre, codigo_felino AS "codigoFelino", estado`,
        [data.gato_id]
      );

      const updatePostRes = await client.query(
        `UPDATE public.postulaciones_adopcion
         SET estado = 'APROBADA_FINALIZADA', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1
         RETURNING id, estado`,
        [postulacionId]
      );

      await client.query('COMMIT');

      return {
        adopcionFormal: vinculoRes.rows[0],
        felino: updateGatoRes.rows[0],
        postulacion: updatePostRes.rows[0],
      };
    } catch (error: any) {
      await client.query('ROLLBACK');
      if (error.code === '23505') {
        throw {
          status: 409,
          message: 'Conflicto de integridad: ya existe un vínculo de adopción vigente para este felino o postulación.',
        };
      }
      throw error;
    } finally {
      client.release();
    }
  }


  static async obtenerFichaAdministrativaGato(gatoId: string) {
    const gatoRes = await query(
      `SELECT 
         g.id,
         g.nombre,
         g.codigo_felino AS "codigoFelino",
         g.estado,
         g.esterilizado,
         g.resultado_vif AS "resultadoVif",
         g.resultado_vilef AS "resultadoVilef",
         g.estado_medico AS "estadoMedico"
       FROM public.gatos g
       WHERE g.id = $1`,
      [gatoId]
    );

    if (gatoRes.rows.length === 0) {
      throw { status: 404, message: 'El felino especificado no existe.' };
    }

    const adoptanteRes = await query(
      `SELECT 
         af.id AS "adopcionId",
         af.postulacion_id AS "postulacionId",
         af.estado_vinculo AS "estadoVinculo",
         af.fecha_adopcion AS "fechaAdopcion",
         af.direccion_tenencia AS "direccionTenencia",
         af.telefono_tenencia AS "telefonoTenencia",
         af.observaciones_entrega AS "observacionesEntrega",
         u.id AS "adoptanteId",
         u.nombre_completo AS "nombreCompleto",
         u.email
       FROM public.adopciones_formales af
       JOIN public.usuarios u ON af.adoptante_id = u.id
       WHERE af.gato_id = $1 AND af.estado_vinculo = 'VIGENTE'
       LIMIT 1`,
      [gatoId]
    );

    return {
      felino: gatoRes.rows[0],
      propietarioAdoptanteActual: adoptanteRes.rows[0] || null,
    };
  }
}