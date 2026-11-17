import { pool, query } from '../config/db';

export interface CreateTratamientoClinicoDto {
  tipoProcedimiento: 'CASTRACION' | 'PRUEBA_VIRAL' | 'TRATAMIENTO_FARMACOLOGICO' | 'CIRUGIA_GENERAL';
  diagnostico: string;
  descripcionTratamiento: string;
  esEsterilizacion?: boolean;
  resultadoVif?: 'PENDIENTE' | 'NEGATIVO' | 'POSITIVO';
  resultadoVilef?: 'PENDIENTE' | 'NEGATIVO' | 'POSITIVO';
  estadoMedico?: 'SANO' | 'EN_TRATAMIENTO' | 'AISLAMIENTO';
  requiereAislamientoOCritico?: boolean;
  veterinarioResponsable: string;
}

export class HistorialClinicoService {

  static async registrarProcedimiento(
    gatoId: string,
    adminId: string,
    dto: CreateTratamientoClinicoDto
  ) {
    const {
      tipoProcedimiento,
      diagnostico,
      descripcionTratamiento,
      esEsterilizacion,
      resultadoVif,
      resultadoVilef,
      estadoMedico,
      requiereAislamientoOCritico,
      veterinarioResponsable,
    } = dto;

    if (!tipoProcedimiento || !diagnostico || !descripcionTratamiento || !veterinarioResponsable) {
      throw {
        status: 400,
        message: 'Los campos tipoProcedimiento, diagnostico, descripcionTratamiento y veterinarioResponsable son obligatorios.',
      };
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const gatoRes = await client.query(
        'SELECT id, estado, esterilizado, resultado_vif, resultado_vilef, estado_medico FROM public.gatos WHERE id = $1 FOR UPDATE',
        [gatoId]
      );

      if (gatoRes.rows.length === 0) {
        throw { status: 404, message: 'El felino especificado no existe en el sistema.' };
      }

      const gatoActual = gatoRes.rows[0];
      const tipoNorm = String(tipoProcedimiento).toUpperCase();
      const marcaEsterilizado = Boolean(esEsterilizacion || tipoNorm === 'CASTRACION');

      const estadoMedicoNorm = estadoMedico
        ? String(estadoMedico).toUpperCase()
        : requiereAislamientoOCritico
        ? 'EN_TRATAMIENTO'
        : 'SANO';

      const esCriticoOAislamiento =
        Boolean(requiereAislamientoOCritico) ||
        estadoMedicoNorm === 'EN_TRATAMIENTO' ||
        estadoMedicoNorm === 'AISLAMIENTO';

      const insertSql = `
        INSERT INTO public.tratamientos_clinicos (
          gato_id,
          tipo_procedimiento,
          diagnostico,
          descripcion_tratamiento,
          es_esterilizacion,
          resultado_vif,
          resultado_vilef,
          estado_medico_resultante,
          requiere_aislamiento_o_critico,
          veterinario_responsable,
          registrado_por,
          fecha_registro
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)
        RETURNING 
          id,
          gato_id AS "gatoId",
          tipo_procedimiento AS "tipoProcedimiento",
          diagnostico,
          descripcion_tratamiento AS "descripcionTratamiento",
          es_esterilizacion AS "esEsterilizacion",
          resultado_vif AS "resultadoVif",
          resultado_vilef AS "resultadoVilef",
          estado_medico_resultante AS "estadoMedicoResultante",
          requiere_aislamiento_o_critico AS "requiereAislamientoOCritico",
          veterinario_responsable AS "veterinarioResponsable",
          registrado_por AS "registradoPor",
          fecha_registro AS "fechaRegistro";
      `;

      const insertRes = await client.query(insertSql, [
        gatoId,
        tipoNorm,
        diagnostico.trim(),
        descripcionTratamiento.trim(),
        marcaEsterilizado,
        resultadoVif ? String(resultadoVif).toUpperCase() : null,
        resultadoVilef ? String(resultadoVilef).toUpperCase() : null,
        estadoMedicoNorm,
        esCriticoOAislamiento,
        veterinarioResponsable.trim(),
        adminId,
      ]);

      const nuevoEsterilizado = marcaEsterilizado ? true : gatoActual.esterilizado;
      const nuevoVif = resultadoVif ? String(resultadoVif).toUpperCase() : gatoActual.resultado_vif;
      const nuevoVilef = resultadoVilef ? String(resultadoVilef).toUpperCase() : gatoActual.resultado_vilef;

      let nuevoEstadoOperativo = gatoActual.estado;
      if (esCriticoOAislamiento) {
        nuevoEstadoOperativo = 'CUARENTENA';
      } else if (estadoMedicoNorm === 'SANO' && gatoActual.estado === 'CUARENTENA') {
        nuevoEstadoOperativo = 'DISPONIBLE';
      }

      const updateGatoSql = `
        UPDATE public.gatos
        SET 
          esterilizado = $1,
          resultado_vif = $2,
          resultado_vilef = $3,
          estado_medico = $4,
          estado = $5
        WHERE id = $6
        RETURNING id, nombre, estado, esterilizado, resultado_vif AS "resultadoVif", resultado_vilef AS "resultadoVilef", estado_medico AS "estadoMedico";
      `;

      const gatoUpdatedRes = await client.query(updateGatoSql, [
        nuevoEsterilizado,
        nuevoVif,
        nuevoVilef,
        estadoMedicoNorm,
        nuevoEstadoOperativo,
        gatoId,
      ]);

      await client.query('COMMIT');

      return {
        registroClinico: insertRes.rows[0],
        estadoFelinoActualizado: gatoUpdatedRes.rows[0],
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async obtenerExpedienteClinico(gatoId: string) {
    const gatoRes = await query(
      `SELECT id, nombre, codigo_felino AS "codigoFelino", estado, esterilizado, 
              resultado_vif AS "resultadoVif", resultado_vilef AS "resultadoVilef", estado_medico AS "estadoMedico"
       FROM public.gatos WHERE id = $1`,
      [gatoId]
    );

    if (gatoRes.rows.length === 0) {
      throw { status: 404, message: 'El felino especificado no existe en el sistema.' };
    }

    const historialRes = await query(
      `SELECT 
         t.id,
         t.tipo_procedimiento AS "tipoProcedimiento",
         t.diagnostico,
         t.descripcion_tratamiento AS "descripcionTratamiento",
         t.es_esterilizacion AS "esEsterilizacion",
         t.resultado_vif AS "resultadoVif",
         t.resultado_vilef AS "resultadoVilef",
         t.estado_medico_resultante AS "estadoMedicoResultante",
         t.requiere_aislamiento_o_critico AS "requiereAislamientoOCritico",
         t.veterinario_responsable AS "veterinarioResponsable",
         u.nombre_completo AS "administradorResponsable",
         t.fecha_registro AS "fechaRegistro"
       FROM public.tratamientos_clinicos t
       JOIN public.usuarios u ON t.registrado_por = u.id
       WHERE t.gato_id = $1
       ORDER BY t.fecha_registro DESC`,
      [gatoId]
    );

    return {
      fichaSanitaria: gatoRes.rows[0],
      historialClinico: historialRes.rows,
    };
  }
}