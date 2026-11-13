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
    | 'EN_REVISION'
    | 'APROBADA'
    | 'FINALIZADA'
    | 'CANCELADA'
    | 'RECHAZADA'

export interface CancelarPostulacionPayload {
    motivo_baja: string
}

export interface PostulacionRegistrada extends CrearPostulacionPayload {
    id: string
    fechaPostulacion: string
    estado: EstadoPostulacion
    documentacion_completa: boolean
    motivo_baja?: string
    cancelada_por?: 'POSTULANTE' | 'ADMIN'
    fecha_baja?: string
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