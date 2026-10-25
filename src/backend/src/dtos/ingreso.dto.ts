// src/dtos/ingreso.dto.ts
export type ViaProcedencia = 'RESCATADO' | 'FUNDACION' | 'PARTICULAR';

export interface CreateIngresoDto {
  gatoId?: string;
  nombreGato?: string;
  edadMeses?: number;
  sexo?: 'MACHO' | 'HEMBRA';
  colorPelaje?: string;
  viaProcedencia: ViaProcedencia;
  nombreInstitucion?: string;
  fechaDerivacion?: string; // Formato YYYY-MM-DD
  observaciones?: string;
}