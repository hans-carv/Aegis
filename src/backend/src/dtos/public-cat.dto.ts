// src/dtos/public-cat.dto.ts
export interface PublicCatResponseDto {
  id: string;
  codigoFelino: string;
  nombre: string;
  edadMeses: number;
  temperamento: string | null;
  talla: string | null;
  colorPelaje: string | null;
  sexo: string | null;
  historia: string | null;
  estado: string;
  fotoUrl: string | null;
}
