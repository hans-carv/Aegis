export interface CreateFranjaDto {
  diaSemana: 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO';
  horaInicio: string;
  horaFin: string;
  aforoMaximo: number;
}

export interface UpdateFranjaDto {
  horaInicio?: string;
  horaFin?: string;
  aforoMaximo?: number;
  activo?: boolean;
  motivoBloqueo?: string;
}