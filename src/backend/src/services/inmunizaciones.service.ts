import { query } from '../config/db';

export interface CreateInmunizacionDto {
  tipoControl: 'VACUNA' | 'DESPARASITACION';
  nombreBiologico: string;
  fechaAplicacion: string;      
  fechaProximoRefuerzo: string; 
  lote?: string;
  veterinarioResponsable?: string;
  observaciones?: string;
}

export class InmunizacionesService {
  static async registrarControl(
    gatoId: string,
    usuarioId: string,
    dto: CreateInmunizacionDto
  ) {
    const {
      tipoControl,
      nombreBiologico,
      fechaAplicacion,
      fechaProximoRefuerzo,
      lote,
      veterinarioResponsable,
      observaciones,
    } = dto;

    if (!tipoControl || !nombreBiologico || !fechaAplicacion || !fechaProximoRefuerzo) {
      throw {
        status: 400,
        message: 'Los campos tipoControl, nombreBiologico, fechaAplicacion y fechaProximoRefuerzo son obligatorios.',
      };
    }

    const tipoNormalizado = String(tipoControl).toUpperCase();
    if (tipoNormalizado !== 'VACUNA' && tipoNormalizado !== 'DESPARASITACION') {
      throw {
        status: 400,
        message: 'El tipoControl debe ser VACUNA o DESPARASITACION.',
      };
    }

    const dateAplicacion = new Date(`${fechaAplicacion}T00:00:00Z`);
    const dateRefuerzo = new Date(`${fechaProximoRefuerzo}T00:00:00Z`);

    if (isNaN(dateAplicacion.getTime()) || isNaN(dateRefuerzo.getTime())) {
      throw {
        status: 400,
        message: 'Formato de fecha inválido. Utiliza YYYY-MM-DD.',
      };
    }

    if (dateRefuerzo <= dateAplicacion) {
      throw {
        status: 400,
        message: 'La fecha de próximo refuerzo debe ser estrictamente posterior a la fecha de aplicación.',
      };
    }

    const gatoRes = await query('SELECT id FROM public.gatos WHERE id = $1', [gatoId]);
    if (gatoRes.rows.length === 0) {
      throw { status: 404, message: 'El felino especificado no existe.' };
    }

    const insertSql = `
      INSERT INTO public.controles_inmunologicos (
        gato_id,
        tipo_control,
        nombre_biologico,
        fecha_aplicacion,
        fecha_proximo_refuerzo,
        lote,
        veterinario_responsable,
        observaciones,
        registrado_por
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING 
        id,
        gato_id AS "gatoId",
        tipo_control AS "tipoControl",
        nombre_biologico AS "nombreBiologico",
        to_char(fecha_aplicacion, 'YYYY-MM-DD') AS "fechaAplicacion",
        to_char(fecha_proximo_refuerzo, 'YYYY-MM-DD') AS "fechaProximoRefuerzo",
        lote,
        veterinario_responsable AS "veterinarioResponsable",
        observaciones,
        created_at AS "createdAt";
    `;

    const res = await query(insertSql, [
      gatoId,
      tipoNormalizado,
      nombreBiologico.trim(),
      fechaAplicacion,
      fechaProximoRefuerzo,
      lote || null,
      veterinarioResponsable || null,
      observaciones || null,
      usuarioId,
    ]);

    return res.rows[0];
  }

  static async listarHistorialPorGato(gatoId: string) {
    const gatoRes = await query('SELECT id FROM public.gatos WHERE id = $1', [gatoId]);
    if (gatoRes.rows.length === 0) {
      throw { status: 404, message: 'El felino especificado no existe.' };
    }

    const sql = `
      SELECT 
        id,
        gato_id AS "gatoId",
        tipo_control AS "tipoControl",
        nombre_biologico AS "nombreBiologico",
        to_char(fecha_aplicacion, 'YYYY-MM-DD') AS "fechaAplicacion",
        to_char(fecha_proximo_refuerzo, 'YYYY-MM-DD') AS "fechaProximoRefuerzo",
        lote,
        veterinario_responsable AS "veterinarioResponsable",
        observaciones,
        created_at AS "createdAt"
      FROM public.controles_inmunologicos
      WHERE gato_id = $1
      ORDER BY fecha_aplicacion ASC, created_at ASC;
    `;

    const res = await query(sql, [gatoId]);
    return res.rows;
  }
}