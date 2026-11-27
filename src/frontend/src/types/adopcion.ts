export interface PropietarioLegalActual {
    adopcionId: string
    postulacionId: string
    estadoVinculo: string
    fechaAdopcion: string
    direccionTenencia: string
    telefonoTenencia: string
    observacionesEntrega?: string | null
    contratoGeneradoAt?: string | null
    contratoFirmadoUrl?: string | null
    adoptanteId: string
    nombreCompleto: string
    email: string
    ci?: string | null
}

export interface FichaAdministrativaGato {
    felino: {
        id: string
        nombre: string
        codigoFelino: string
        estado: string
        fotoUrl?: string | null
        esterilizado?: boolean
        resultadoVif?: string
        resultadoVilef?: string
        estadoMedico?: string
    }
    propietarioAdoptanteActual: PropietarioLegalActual | null
}

export interface AdopcionFormalItem extends PropietarioLegalActual {
    gatoId: string
    gatoNombre: string
    codigoFelino: string
    gatoEstado: string
    gatoFotoUrl?: string | null
}

export interface VincularAdopcionDto {
    postulacionId: string
    observacionesEntrega?: string
}

export interface VincularAdopcionResponse {
    adopcionFormal: {
        id: string
        postulacionId: string
        gatoId: string
        adoptanteId: string
        administradorId: string
        direccionTenencia: string
        telefonoTenencia: string
        observacionesEntrega?: string | null
        estadoVinculo: string
        fechaAdopcion: string
    }
    felino: {
        id: string
        nombre: string
        codigoFelino: string
        estado: string
    }
    postulacion: {
        id: string
        estado: string
    }
}

export interface ContratoFirmadoResponse {
    id: string
    postulacionId: string
    gatoId: string
    contratoGeneradoAt?: string | null
    contratoFirmadoUrl: string
}
