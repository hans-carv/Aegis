import type {
    CrearPostulacionPayload,
    DocumentosPostulacionFiles,
    PostulacionRegistrada,
} from '../types/postulacion'

export class PostulacionApiError extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/png']

let postulacionesMock: PostulacionRegistrada[] = []

/**
 * Paso A: POST /api/postulaciones
 */
export async function crearPostulacion(
    payload: CrearPostulacionPayload
): Promise<PostulacionRegistrada> {
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (!payload.gatoId) {
        throw new PostulacionApiError(404, 'El felino seleccionado no existe en el sistema.')
    }

    if (
        payload.presupuestoMensual <= 0 ||
        !payload.telefonoContacto.trim() ||
        !payload.direccionDomicilio.trim()
    ) {
        throw new PostulacionApiError(
            400,
            'Faltan respuestas obligatorias o los datos ingresados son inválidos.'
        )
    }

    // Simular conflicto si ya postuló al mismo gato
    const yaPostulo = postulacionesMock.some((p) => p.gatoId === payload.gatoId)
    if (yaPostulo) {
        throw new PostulacionApiError(
            409,
            'Ya tienes una postulación registrada para este felino o ya no está disponible para adopción.'
        )
    }

    const nueva: PostulacionRegistrada = {
        ...payload,
        id: `post-${Date.now()}`,
        fechaPostulacion: new Date().toISOString().split('T')[0],
        estado: 'PENDIENTE_REVISION',
        documentacion_completa: false,
    }

    postulacionesMock = [nueva, ...postulacionesMock]
    return nueva
}

/**
 * Paso B: POST /api/postulaciones/:id/documentos (multipart/form-data)
 */
export async function subirDocumentosPostulacion(
    postulacionId: string,
    archivos: DocumentosPostulacionFiles
): Promise<PostulacionRegistrada> {
    await new Promise((resolve) => setTimeout(resolve, 850))

    const postulacion = postulacionesMock.find((p) => p.id === postulacionId)
    if (!postulacion) {
        throw new PostulacionApiError(404, 'No se encontró la postulación para adjuntar documentos.')
    }

    if (postulacion.documentacion_completa) {
        throw new PostulacionApiError(
            403,
            'No tienes permiso para modificar una postulación que ya fue enviada.'
        )
    }

    // Construcción real de FormData lista para el backend
    const formData = new FormData()
    formData.append('carnetIdentidad', archivos.carnetIdentidad)
    formData.append('facturaServicio', archivos.facturaServicio)
    formData.append('croquisDomicilio', archivos.croquisDomicilio)

    const listaArchivos = [
        archivos.carnetIdentidad,
        archivos.facturaServicio,
        archivos.croquisDomicilio,
    ]

    for (const file of listaArchivos) {
        if (!TIPOS_PERMITIDOS.includes(file.type)) {
            throw new PostulacionApiError(
                400,
                `El archivo "${file.name}" tiene un formato inválido. Solo se permite PDF, JPG o PNG.`
            )
        }
        if (file.size > MAX_BYTES) {
            throw new PostulacionApiError(
                413,
                `El archivo "${file.name}" supera el tamaño máximo permitido de 5 MB.`
            )
        }
    }

    // Simula cifrado AES-256 en backend y actualización de documentacion_completa
    const actualizada: PostulacionRegistrada = {
        ...postulacion,
        documentacion_completa: true,
    }

    postulacionesMock = postulacionesMock.map((p) =>
        p.id === postulacionId ? actualizada : p
    )

    return actualizada
}

export async function listarMisPostulaciones(): Promise<PostulacionRegistrada[]> {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return [...postulacionesMock]
}