// src/dtos/cat.dto.ts
export type EstadoFelino = 'CUARENTENA' | 'ADOPCION' | 'ADOPTADO';
export type SexoFelino = 'MACHO' | 'HEMBRA';

export interface CreateCatDto {
  codigoFelino: string;
  nombre: string;
  peso: number;
  talla?: string;
  edadMeses: number;
  temperamento?: string;
  colorPelaje?: string;
  sexo?: SexoFelino;
  estado?: EstadoFelino;
  fotoUrl?: string;   
  historia?: string;   
}

export interface UpdateCatDto {
  nombre?: string;
  peso?: number;
  talla?: string;
  edadMeses?: number;
  temperamento?: string;
  colorPelaje?: string;
  sexo?: SexoFelino;
  estado?: EstadoFelino;
  fotoUrl?: string;
  historia?: string;
}