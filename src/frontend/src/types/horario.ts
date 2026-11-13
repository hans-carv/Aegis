export type DiaSemana =
    | 'LUNES'
    | 'MARTES'
    | 'MIERCOLES'
    | 'JUEVES'
    | 'VIERNES'
    | 'SABADO'
    | 'DOMINGO'

export interface FranjaHoraria {
    id: string
    diaSemana: DiaSemana
    horaInicio: string
    horaFin: string
    aforoMaximo: number
    activo: boolean
    motivoBloqueo?: string
}

export type FranjaHorariaPayload = Omit<FranjaHoraria, 'id'>