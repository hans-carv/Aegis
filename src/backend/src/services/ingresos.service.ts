// src/services/ingresos.service.ts
import { query } from '../config/db';
import { CreateIngresoDto } from '../dtos/ingreso.dto';

export class IngresosService {
  static async registrarIngreso(dto: CreateIngresoDto, userId: string) {
    const {
      gatoId,
      nombreGato,
      edadMeses,
      sexo,
      colorPelaje,
      viaProcedencia,
      nombreInstitucion,
      fechaDerivacion,
      observaciones,
    } = dto;

    const viasValidas = ['RESCATADO', 'FUNDACION', 'PARTICULAR'];
    if (!viaProcedencia || !viasValidas.includes(viaProcedencia)) {
      throw {
        status: 400,
        message: 'La vía de procedencia es obligatoria y debe ser: RESCATADO, FUNDACION o PARTICULAR.',
      };
    }

    if (viaProcedencia === 'FUNDACION') {
      if (!nombreInstitucion || nombreInstitucion.trim() === '') {
        throw {
          status: 400,
          message: 'El nombre de la institución es obligatorio cuando la procedencia es FUNDACION.',
        };
      }
      if (!fechaDerivacion || fechaDerivacion.trim() === '') {
        throw {
          status: 400,
          message: 'La fecha de derivación es obligatoria cuando la procedencia es FUNDACION.',
        };
      }
    }

    let finalGatoId = gatoId;

    if (!finalGatoId) {
      if (!nombreGato || nombreGato.trim() === '') {
        throw {
          status: 400,
          message: 'Debe especificar el id del gato o el nombre para su registro.',
        };
      }

      const insertGatoSql = `
        INSERT INTO gatos (nombre, edad_meses, sexo, color_pelaje)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const gatoRes = await query(insertGatoSql, [
        nombreGato.trim(),
        edadMeses ?? null,
        sexo ?? null,
        colorPelaje ?? null,
      ]);
      finalGatoId = gatoRes.rows[0].id;
    }

    const insertIngresoSql = `
      INSERT INTO ingresos_felinos (
        gato_id,
        via_procedencia,
        nombre_institucion,
        fecha_derivacion,
        observaciones,
        created_by
      )
      VALUES ($1, $2, $3, $4::DATE, $5, $6)
      RETURNING id, gato_id, via_procedencia, nombre_institucion, fecha_derivacion, observaciones, created_at, created_by
    `;

    const institucionLimpia = viaProcedencia === 'FUNDACION' ? (nombreInstitucion?.trim() ?? null) : null;
    const derivacionLimpia = viaProcedencia === 'FUNDACION' ? (fechaDerivacion ?? null) : null;

    const resIngreso = await query(insertIngresoSql, [
      finalGatoId,
      viaProcedencia,
      institucionLimpia,
      derivacionLimpia,
      observaciones ?? null,
      userId,
    ]);

    return resIngreso.rows[0];
  }

  static async listarIngresos() {
    const sql = `
      SELECT 
        i.id,
        i.via_procedencia,
        i.nombre_institucion,
        i.fecha_derivacion,
        i.observaciones,
        i.created_at,
        g.id AS gato_id,
        g.nombre AS nombre_gato,
        g.sexo,
        u.nombre_completo AS registrado_por
      FROM ingresos_felinos i
      INNER JOIN gatos g ON i.gato_id = g.id
      INNER JOIN usuarios u ON i.created_by = u.id
      ORDER BY i.created_at DESC
    `;
    const res = await query(sql);
    return res.rows;
  }
}