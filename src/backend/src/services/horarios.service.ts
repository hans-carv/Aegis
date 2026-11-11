import { query } from '../config/db';
import { CreateFranjaDto, UpdateFranjaDto } from '../dtos/horario.dto';

export class HorariosService {
  static async verificarSolapamiento(
    diaSemana: string,
    horaInicio: string,
    horaFin: string,
    excluirId?: string
  ): Promise<boolean> {
    const sql = `
      SELECT id FROM public.franjas_horarias
      WHERE dia_semana = $1
        AND activo = TRUE
        AND hora_inicio < $3::time
        AND hora_fin > $2::time
        ${excluirId ? 'AND id <> $4' : ''}
      LIMIT 1;
    `;
    const params = excluirId ? [diaSemana, horaInicio, horaFin, excluirId] : [diaSemana, horaInicio, horaFin];
    const res = await query(sql, params);
    return res.rows.length > 0;
  }

  static async crearFranja(dto: CreateFranjaDto) {
    const { diaSemana, horaInicio, horaFin, aforoMaximo } = dto;

    if (!aforoMaximo || Number(aforoMaximo) <= 0) {
      throw { status: 400, message: 'El aforo máximo debe ser un entero positivo mayor a 0.' };
    }

    if (horaInicio >= horaFin) {
      throw { status: 400, message: 'La hora de inicio debe ser anterior a la hora de fin.' };
    }

    const haySolapamiento = await this.verificarSolapamiento(diaSemana, horaInicio, horaFin);
    if (haySolapamiento) {
      throw {
        status: 409,
        message: `Ya existe una franja horaria activa que se cruza con el horario ${horaInicio} - ${horaFin} el día ${diaSemana}.`,
      };
    }

    const sql = `
      INSERT INTO public.franjas_horarias (dia_semana, hora_inicio, hora_fin, aforo_maximo)
      VALUES ($1, $2::time, $3::time, $4)
      RETURNING id, dia_semana AS "diaSemana", hora_inicio AS "horaInicio", hora_fin AS "horaFin", aforo_maximo AS "aforoMaximo", activo, motivo_bloqueo AS "motivoBloqueo";
    `;

    const res = await query(sql, [diaSemana, horaInicio, horaFin, aforoMaximo]);
    return res.rows[0];
  }

  static async actualizarFranja(id: string, dto: UpdateFranjaDto) {
    const franjaActual = await query('SELECT * FROM public.franjas_horarias WHERE id = $1', [id]);
    if (franjaActual.rows.length === 0) {
      throw { status: 404, message: 'Franja horaria no encontrada.' };
    }

    const actual = franjaActual.rows[0];
    const horaInicio = dto.horaInicio || actual.hora_inicio;
    const horaFin = dto.horaFin || actual.hora_fin;
    const diaSemana = actual.dia_semana;
    const activo = dto.activo !== undefined ? dto.activo : actual.activo;

    if (activo && (dto.horaInicio || dto.horaFin)) {
      const haySolapamiento = await this.verificarSolapamiento(diaSemana, horaInicio, horaFin, id);
      if (haySolapamiento) {
        throw {
          status: 409,
          message: `El nuevo rango horario se solapa con otra franja existente para el día ${diaSemana}.`,
        };
      }
    }

    const sql = `
      UPDATE public.franjas_horarias
      SET 
        hora_inicio = COALESCE($1::time, hora_inicio),
        hora_fin = COALESCE($2::time, hora_fin),
        aforo_maximo = COALESCE($3, aforo_maximo),
        activo = COALESCE($4, activo),
        motivo_bloqueo = $5,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $6
      RETURNING id, dia_semana AS "diaSemana", hora_inicio AS "horaInicio", hora_fin AS "horaFin", aforo_maximo AS "aforoMaximo", activo, motivo_bloqueo AS "motivoBloqueo";
    `;

    const res = await query(sql, [
      dto.horaInicio ?? null,
      dto.horaFin ?? null,
      dto.aforoMaximo ?? null,
      dto.activo ?? null,
      dto.motivoBloqueo !== undefined ? dto.motivoBloqueo : actual.motivo_bloqueo,
      id,
    ]);

    return res.rows[0];
  }

  static async listarFranjas(soloActivos = false) {
    const sql = `
      SELECT id, dia_semana AS "diaSemana", hora_inicio AS "horaInicio", hora_fin AS "horaFin", aforo_maximo AS "aforoMaximo", activo, motivo_bloqueo AS "motivoBloqueo"
      FROM public.franjas_horarias
      ${soloActivos ? 'WHERE activo = TRUE' : ''}
      ORDER BY 
        CASE dia_semana
          WHEN 'LUNES' THEN 1 WHEN 'MARTES' THEN 2 WHEN 'MIERCOLES' THEN 3
          WHEN 'JUEVES' THEN 4 WHEN 'VIERNES' THEN 5 WHEN 'SABADO' THEN 6 WHEN 'DOMINGO' THEN 7
        END, hora_inicio ASC;
    `;
    const res = await query(sql);
    return res.rows;
  }
}