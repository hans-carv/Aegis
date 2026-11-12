import type { DiaSemana } from './horario'

export interface DisponibilidadFranja {
    franjaId: string
    diaSemana: DiaSemana
    horaInicio: string
    horaFin: string
    aforoMaximo: number
    cuposOcupados: number
    cuposDisponibles: number
    activo: boolean
    motivoBloqueo?: string
    disponible: boolean
}

export interface CrearReservaPayload {
    franjaId: string
    fechaReserva: string 
    cantidadPersonas?: number
}

export type EstadoReserva = 'CONFIRMADA' | 'CANCELADA' | 'COMPLETADA' | 'NO_ASISTIO'

export interface ReservaUsuario {
    id: string
    fechaReserva: string 
    horaInicio: string
    horaFin: string
    cantidadPersonas: number
    estado: EstadoReserva
}