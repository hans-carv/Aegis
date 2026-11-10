export interface CreateReservaDto {
  franjaId: string;
  fechaReserva: string; // Formato "YYYY-MM-DD"
  cantidadPersonas?: number;
}

export interface DisponibilidadResponseDto {
  franjaId: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  aforoMaximo: number;
  cuposOcupados: number;
  cuposDisponibles: number;
  activo: boolean;
  motivoBloqueo: string | null;
  disponible: boolean;
}