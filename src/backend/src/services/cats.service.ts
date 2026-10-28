// src/services/cats.service.ts
import { query } from '../config/db';
import { CreateCatDto, UpdateCatDto } from '../dtos/cat.dto';
import { PublicCatResponseDto } from '../dtos/public-cat.dto';

export class CatsService {
  static async registrarFelino(dto: CreateCatDto) {
    const {
      codigoFelino,
      nombre,
      peso,
      talla,
      edadMeses,
      temperamento,
      colorPelaje,
      sexo,
      estado = 'CUARENTENA',
      fotoUrl,
      historia,
    } = dto;

    if (!codigoFelino || typeof codigoFelino !== 'string' || codigoFelino.trim() === '') {
      throw { status: 400, message: 'El código del felino es obligatorio.' };
    }

    const alfanumericoRegex = /^[a-zA-Z0-9-_]+$/;
    if (!alfanumericoRegex.test(codigoFelino.trim())) {
      throw {
        status: 400,
        message: 'El código del felino debe ser alfanumérico (solo letras, números y guiones).',
      };
    }

    if (!nombre || nombre.trim() === '') {
      throw { status: 400, message: 'El nombre del felino es obligatorio.' };
    }

    if (peso === undefined || peso === null || Number(peso) <= 0) {
      throw { status: 400, message: 'El peso es obligatorio y debe ser un número positivo mayor a 0.' };
    }

    if (
      edadMeses === undefined ||
      edadMeses === null ||
      Number(edadMeses) <= 0 ||
      !Number.isInteger(Number(edadMeses))
    ) {
      throw { status: 400, message: 'La edad estimada en meses debe ser un número entero positivo mayor a 0.' };
    }

    const estadosValidos = ['CUARENTENA', 'DISPONIBLE', 'ADOPCION', 'ADOPTADO'];
    if (!estadosValidos.includes(estado)) {
      throw { status: 400, message: 'El estado debe ser CUARENTENA, DISPONIBLE o ADOPCION.' };
    }

    try {
      const sql = `
        INSERT INTO public.gatos (
          codigo_felino,
          nombre,
          peso,
          talla,
          edad_meses,
          temperamento,
          color_pelaje,
          sexo,
          estado,
          foto_url,
          historia
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, codigo_felino, nombre, peso, talla, edad_meses, temperamento, color_pelaje, sexo, estado, foto_url, historia, created_at
      `;

      const res = await query(sql, [
        codigoFelino.trim().toUpperCase(),
        nombre.trim(),
        Number(peso),
        talla?.trim() ?? null,
        Number(edadMeses),
        temperamento?.trim() ?? null,
        colorPelaje?.trim() ?? null,
        sexo ?? null,
        estado,
        fotoUrl?.trim() ?? null,
        historia?.trim() ?? null,
      ]);

      return res.rows[0];
    } catch (err: any) {
      if (err.code === '23505') {
        throw {
          status: 409,
          message: `El código felino '${codigoFelino.trim().toUpperCase()}' ya se encuentra registrado en el sistema.`,
        };
      }
      throw err;
    }
  }

  static async listarFelinos(userRole?: string) {
    const sql = `
      SELECT id, codigo_felino, nombre, peso, talla, edad_meses, temperamento, color_pelaje, sexo, estado, foto_url, historia, created_at
      FROM public.gatos
      ORDER BY created_at DESC
    `;
    const res = await query(sql);

    if (userRole !== 'ADMIN') {
      return res.rows.map(({ foto_url, ...resto }) => resto);
    }
    return res.rows;
  }

  static async obtenerPorIdOCodigo(identificador: string, userRole?: string) {
    const sql = `
      SELECT id, codigo_felino, nombre, peso, talla, edad_meses, temperamento, color_pelaje, sexo, estado, foto_url, historia, created_at
      FROM public.gatos
      WHERE codigo_felino = $1 OR id::text = $1
    `;
    const res = await query(sql, [identificador.toUpperCase()]);
    if (res.rows.length === 0) {
      throw { status: 404, message: 'Ficha técnica del felino no encontrada.' };
    }

    const felino = res.rows[0];
    if (userRole !== 'ADMIN') {
      const { foto_url, ...resto } = felino;
      return resto;
    }
    return felino;
  }

  static async actualizarFelino(id: string, dto: UpdateCatDto) {
    if (dto.peso !== undefined && Number(dto.peso) <= 0) {
      throw { status: 400, message: 'El peso debe ser un número positivo mayor a 0.' };
    }
    if (dto.edadMeses !== undefined && (Number(dto.edadMeses) <= 0 || !Number.isInteger(Number(dto.edadMeses)))) {
      throw { status: 400, message: 'La edad estimada debe ser un entero positivo.' };
    }

    const felinoExistente = await this.obtenerPorIdOCodigo(id, 'ADMIN');

    const sql = `
      UPDATE public.gatos
      SET
        nombre = COALESCE($1, nombre),
        peso = COALESCE($2, peso),
        talla = COALESCE($3, talla),
        edad_meses = COALESCE($4, edad_meses),
        temperamento = COALESCE($5, temperamento),
        color_pelaje = COALESCE($6, color_pelaje),
        sexo = COALESCE($7, sexo),
        estado = COALESCE($8, estado),
        foto_url = COALESCE($9, foto_url),
        historia = COALESCE($10, historia)
      WHERE id = $11
      RETURNING id, codigo_felino, nombre, peso, talla, edad_meses, temperamento, color_pelaje, sexo, estado, foto_url, historia, created_at
    `;

    const res = await query(sql, [
      dto.nombre ?? null,
      dto.peso ? Number(dto.peso) : null,
      dto.talla ?? null,
      dto.edadMeses ? Number(dto.edadMeses) : null,
      dto.temperamento ?? null,
      dto.colorPelaje ?? null,
      dto.sexo ?? null,
      dto.estado ?? null,
      dto.fotoUrl ?? null,
      dto.historia ?? null,
      felinoExistente.id,
    ]);

    return res.rows[0];
  }

  static async obtenerCatalogoPublico(): Promise<PublicCatResponseDto[]> {
    const sql = `
      SELECT 
        id,
        codigo_felino,
        nombre,
        edad_meses,
        temperamento,
        talla,
        color_pelaje,
        sexo,
        historia,
        estado,
        foto_url
      FROM public.gatos
      WHERE estado = 'DISPONIBLE'
      ORDER BY created_at DESC
    `;

    const res = await query(sql);

    return res.rows.map((row) => ({
      id: row.id,
      codigoFelino: row.codigo_felino,
      nombre: row.nombre,
      edadMeses: row.edad_meses,
      temperamento: row.temperamento,
      talla: row.talla,
      colorPelaje: row.color_pelaje,
      sexo: row.sexo,
      historia: row.historia,
      estado: row.estado,
      fotoUrl: row.foto_url,
    }));
  }
}

export default CatsService;