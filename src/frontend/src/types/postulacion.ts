export interface CrearPostulacionPayload {
    gatoId: string
    presupuestoMensual: number
    telefonoContacto: string
    direccionDomicilio: string
    tieneMallasProteccion: boolean
    permisoPropietario: boolean
    compromisoTenenciaResponsable: boolean
    otrosAnimalesEnCasa?: string
    tiempoSoloAlDiaHoras?: number
}

export type NombreCampoDocumento =
    | 'carnetIdentidad'
    | 'facturaServicio'
    | 'croquisDomicilio'

export interface DocumentosPostulacionFiles {
    carnetIdentidad: File
    facturaServicio: File
    croquisDomicilio: File
}

export type EstadoPostulacion =
    | 'PENDIENTE_REVISION'
    | 'APROBADA'
    | 'RECHAZADA'

export interface PostulacionRegistrada extends CrearPostulacionPayload {
    id: string
    fechaPostulacion: string
    estado: EstadoPostulacion
    documentacion_completa: boolean
}

export interface EstadoDocumentoAdmin {
    campo: NombreCampoDocumento
    etiqueta: string
    cargado: boolean
    tipoMime: 'application/pdf' | 'image/jpeg' | 'image/png'
    nombreArchivo: string
}

export interface PostulacionAdmin extends PostulacionRegistrada {
    postulanteNombre: string
    postulanteEmail: string
    felinoNombre: string
    documentos: EstadoDocumentoAdmin[]
}