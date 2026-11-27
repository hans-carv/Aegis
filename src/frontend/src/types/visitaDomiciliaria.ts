export type EstadoVisitaDomiciliaria = 'PROGRAMADA' | 'REALIZADA' | 'CANCELADA'

export type DictamenVisita =
    | 'APROBADA'
    | 'RECHAZADA'
    | 'PENDIENTE_ADECUACIONES'

export interface CreateVisitaDomiciliariaDto {
    postulacionId: string
    evaluadorId?: string
    fechaVisita: string
    horaInicio: string
    horaFin: string
    direccionConfirmada?: string
    observaciones?: string
}

export interface EmitirDictamenDto {
    dictamen: DictamenVisita
    observaciones: string
    diasPlazoSubsanacion?: number
}

export interface VisitaDomiciliaria {
    id: string
    postulacionId: string
    evaluadorId: string
    evaluadorNombre?: string
    fechaVisita: string
    horaInicio: string
    horaFin: string
    direccionConfirmada: string
    observaciones?: string | null
    estado: EstadoVisitaDomiciliaria
    dictamen?: DictamenVisita
    observacionesDictamen?: string
    fechaLimiteSubsanacion?: string | null
    fechaDictamen?: string
    evidenciaAdecuacionesUrls: string[]
    postulanteNombre?: string
    postulanteEmail?: string
    gatoId?: string
    gatoNombre?: string
}