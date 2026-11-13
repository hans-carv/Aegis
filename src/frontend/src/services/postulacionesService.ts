import type {
    CancelarPostulacionPayload,
    CrearPostulacionPayload,
    DocumentosPostulacionFiles,
    PostulacionRegistrada,
    NombreCampoDocumento,
    PostulacionAdmin,
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

let postulacionesMock: PostulacionAdmin[] = [
    {
        id: 'post-101',
        gatoId: 'CAT-PUB-03',
        felinoNombre: 'Oliver',
        postulanteNombre: 'Camila Mendoza',
        postulanteEmail: 'camila.mendoza@correo.com',
        fechaPostulacion: '2026-11-10',
        estado: 'PENDIENTE_REVISION',
        documentacion_completa: true,
        presupuestoMensual: 400,
        telefonoContacto: '71548920',
        direccionDomicilio: 'Sopocachi, Av. Ecuador #2410, Edif. Illimani Piso 3',
        tieneMallasProteccion: true,
        permisoPropietario: true,
        compromisoTenenciaResponsable: true,
        otrosAnimalesEnCasa: 'Sí, una gata adulta esterilizada y vacunada',
        tiempoSoloAlDiaHoras: 4,
        documentos: [

            {
                campo: 'carnetIdentidad',
                etiqueta: 'Cédula de identidad',
                cargado: true,
                tipoMime: 'image/png',
                nombreArchivo: 'ci_camila_mendoza.png',
            },
            {
                campo: 'facturaServicio',
                etiqueta: 'Comprobante de servicios básicos',
                cargado: true,
                tipoMime: 'application/pdf',
                nombreArchivo: 'factura_luz_octubre.pdf',
            },
            {
                campo: 'croquisDomicilio',
                etiqueta: 'Croquis del domicilio',
                cargado: true,
                tipoMime: 'image/png',
                nombreArchivo: 'croquis_sopocachi.png',
            },
        ],
    },
    {
        id: 'post-102',
        gatoId: 'CAT-PUB-04',
        felinoNombre: 'Mía',
        postulanteNombre: 'Diego Paredes',
        postulanteEmail: 'diego.paredes@correo.com',
        fechaPostulacion: '2026-11-12',
        estado: 'APROBADA',
        documentacion_completa: false,
        presupuestoMensual: 280,
        telefonoContacto: '69823411',
        direccionDomicilio: 'Miraflores, Calle Díaz Romero #1180',
        tieneMallasProteccion: true,
        permisoPropietario: true,
        compromisoTenenciaResponsable: true,
        otrosAnimalesEnCasa: 'No tengo otros animales',
        tiempoSoloAlDiaHoras: 6,
        documentos: [
            {
                campo: 'carnetIdentidad',
                etiqueta: 'Cédula de identidad',
                cargado: true,
                tipoMime: 'image/png',
                nombreArchivo: 'ci_diego_paredes.png',
            },
            {
                campo: 'facturaServicio',
                etiqueta: 'Comprobante de servicios básicos',
                cargado: true,
                tipoMime: 'image/png',
                nombreArchivo: 'factura_agua.png',
            },
            {
                campo: 'croquisDomicilio',
                etiqueta: 'Croquis del domicilio',
                cargado: false,
                tipoMime: 'image/png',
                nombreArchivo: '',
            },
        ],
    },
]

/**
 * Paso A: POST /api/postulaciones
 */
export async function crearPostulacion(
    payload: CrearPostulacionPayload,
    datosUsuario: { nombre?: string; email?: string }
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

    // Verifica si el felino ya tiene una solicitud activa (no cancelada ni rechazada)
    const felinoOcupado = postulacionesMock.some(
        (p) =>
        p.gatoId === payload.gatoId &&
        p.estado !== 'CANCELADA' &&
        p.estado !== 'RECHAZADA'
    )

    if (felinoOcupado) {
        throw new PostulacionApiError(
        409,
        'Ya tienes una postulación activa para este felino o ya se encuentra en proceso de adopción.'
        )
    }

    const nueva: PostulacionAdmin = {
        ...payload,
        id: `post-${Date.now()}`,
        postulanteNombre: datosUsuario?.nombre || 'Usuario Registrado',
        postulanteEmail: datosUsuario?.email || 'usuario@correo.com',
        felinoNombre: payload.gatoId,
        fechaPostulacion: new Date().toISOString().split('T')[0],
        estado: 'PENDIENTE_REVISION',
        documentacion_completa: false,
        documentos: [
            { campo: 'carnetIdentidad', etiqueta: 'Cédula de identidad', cargado: false, tipoMime: 'application/pdf', nombreArchivo: '' },
            { campo: 'facturaServicio', etiqueta: 'Comprobante de servicios básicos', cargado: false, tipoMime: 'application/pdf', nombreArchivo: '' },
            { campo: 'croquisDomicilio', etiqueta: 'Croquis del domicilio', cargado: false, tipoMime: 'application/pdf', nombreArchivo: '' },
        ],
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

    // Simula la actualización de la postulación con los documentos cargados
    const actualizada: PostulacionAdmin = {
        ...postulacion,
        documentacion_completa: true,
        documentos: [
            {
                campo: 'carnetIdentidad',
                etiqueta: 'Cédula de identidad',
                cargado: true,
                tipoMime: archivos.carnetIdentidad.type as 'application/pdf' | 'image/jpeg' | 'image/png',
                nombreArchivo: archivos.carnetIdentidad.name,
            },
            {
                campo: 'facturaServicio',
                etiqueta: 'Comprobante de servicios básicos',
                cargado: true,
                tipoMime: archivos.facturaServicio.type as 'application/pdf' | 'image/jpeg' | 'image/png',
                nombreArchivo: archivos.facturaServicio.name,
            },
            {
                campo: 'croquisDomicilio',
                etiqueta: 'Croquis del domicilio',
                cargado: true,
                tipoMime: archivos.croquisDomicilio.type as 'application/pdf' | 'image/jpeg' | 'image/png',
                nombreArchivo: archivos.croquisDomicilio.name,
            },
        ],
    }

    postulacionesMock = postulacionesMock.map((p) =>
        p.id === postulacionId ? actualizada : p
    )

    return actualizada
}

export async function listarMisPostulaciones(
    emailUsuario?: string
): Promise<PostulacionRegistrada[]> {
    await new Promise((resolve) => setTimeout(resolve, 400))

    if (!emailUsuario) return[]
    return postulacionesMock.filter(
        (p) => p.postulanteEmail.toLowerCase() === emailUsuario.toLowerCase()
    )
}

export async function listarPostulacionesAdmin(): Promise<PostulacionAdmin[]> {
    await new Promise((resolve) => setTimeout(resolve, 450))
    return [...postulacionesMock]
}

/**
 * Simula GET /api/admin/postulaciones/:id/documentos/:campo con header Authorization: Bearer <JWT>
 * Devuelve un Blob descifrado en memoria sin exponer URLs públicas ni rutas de servidor.
 */
export async function obtenerDocumentoSeguroBlob(
    postulacionId: string,
    campo: NombreCampoDocumento,
    esAdmin: boolean
): Promise<{ blob: Blob; tipoMime: string; nombreArchivo: string }> {
    await new Promise((resolve) => setTimeout(resolve, 600))

    if (!esAdmin) {
        throw new PostulacionApiError(
        403,
        'Acceso denegado: se requiere autorización con rol ADMIN para descifrar este documento.'
        )
    }
    const postulacion = postulacionesMock.find((p) => p.id === postulacionId)
    if (!postulacion) {
        throw new PostulacionApiError(404, 'Expediente de postulación no encontrado.')
    }

    const doc = postulacion.documentos.find((d) => d.campo === campo)
    if (!doc || !doc.cargado) {
        throw new PostulacionApiError(404, 'El documento solicitado no ha sido adjuntado.')
    }

    // Genera una vista previa en memoria (Canvas -> Blob) simulando el stream descifrado por AES-256
    const canvas = document.createElement('canvas')
    canvas.width = 800
    canvas.height = 520
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#FAF7F0'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.strokeStyle = '#172641'
    ctx.lineWidth = 4
    ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48)

    ctx.fillStyle = '#172641'
    ctx.font = 'bold 26px sans-serif'
    ctx.fillText('PROYECTO TEO · VISOR SEGURO DE EXPEDIENTE', 56, 85)

    ctx.fillStyle = '#795548'
    ctx.font = 'bold 18px sans-serif'
    ctx.fillText(`Documento descifrado (AES-256): ${doc.etiqueta}`, 56, 130)

    ctx.fillStyle = '#172641'
    ctx.font = '16px sans-serif'
    ctx.fillText(`Expediente ID: ${postulacion.id}`, 56, 185)
    ctx.fillText(`Postulante: ${postulacion.postulanteNombre} (${postulacion.postulanteEmail})`, 56, 220)
    ctx.fillText(`Felino solicitado: ${postulacion.felinoNombre} (${postulacion.gatoId})`, 56, 255)
    ctx.fillText(`Archivo original: ${doc.nombreArchivo}`, 56, 290)

    ctx.fillStyle = '#A9D6E8'
    ctx.fillRect(56, 340, 688, 95)
    ctx.fillStyle = '#172641'
    ctx.font = 'bold 15px sans-serif'
    ctx.fillText('Stream protegido cargado en memoria temporal (Blob ObjectURL).', 76, 380)
    ctx.font = '14px sans-serif'
    ctx.fillText('Al cerrar este visor, la referencia en memoria se revoca automáticamente.', 76, 408)

    const blob: Blob = await new Promise((resolve) =>
        canvas.toBlob((b) => resolve(b!), 'image/png')
    )

    return {
        blob,
        tipoMime: 'image/png',
        nombreArchivo: doc.nombreArchivo,
    }
}

export async function cancelarPostulacion(
    postulacionId: string,
    payload: CancelarPostulacionPayload,
    contextoActor: { rol: 'ADMIN' | 'USUARIO'; emailUsuario?: string }
): Promise<PostulacionAdmin> {
    await new Promise((resolve) => setTimeout(resolve, 550))

    const motivoLimpio = payload.motivo_baja?.trim()
    if (!motivoLimpio) {
        throw new PostulacionApiError(
        400,
        'El motivo de cancelación (motivo_baja) es obligatorio.'
        )
    }

    const index = postulacionesMock.findIndex((p) => p.id === postulacionId)
    if (index === -1) {
        throw new PostulacionApiError(404, 'La postulación indicada no existe.')
    }

    const actual = postulacionesMock[index]

    const emailsPropiosSimulados = [
        contextoActor.emailUsuario,
        'usuario@correo.com',
        'camila.mendoza@correo.com',
    ].filter(Boolean)

    if (
        contextoActor.rol !== 'ADMIN' &&
        !emailsPropiosSimulados.includes(actual.postulanteEmail)
    ) {
        throw new PostulacionApiError(
        403,
        'No tienes autorización para cancelar una solicitud que pertenece a otro usuario.'
        )
    }

    // Validar propiedad si quien cancela es un postulante (no ADMIN)
    if (
        contextoActor.rol !== 'ADMIN' &&
        contextoActor.emailUsuario &&
        actual.postulanteEmail !== contextoActor.emailUsuario &&
        actual.postulanteEmail !== 'usuario@correo.com'
    ) {
        throw new PostulacionApiError(
        403,
        'No tienes autorización para cancelar una solicitud que pertenece a otro usuario.'
        )
    }

    // HTTP 409: Si ya está finalizada con contrato firmado
    if (actual.estado === 'FINALIZADA') {
        throw new PostulacionApiError(
        409,
        'No es posible cancelar esta postulación porque el proceso ya fue finalizado con contrato firmado.'
        )
    }

    if (actual.estado === 'CANCELADA') {
        throw new PostulacionApiError(409, 'Esta postulación ya se encuentra cancelada.')
    }

    const fechaHoy = new Date().toISOString().split('T')[0]
    const cancelada: PostulacionAdmin = {
        ...actual,
        estado: 'CANCELADA',
        motivo_baja: motivoLimpio,
        cancelada_por: contextoActor.rol === 'ADMIN' ? 'ADMIN' : 'POSTULANTE',
        fecha_baja: fechaHoy,
    }

    postulacionesMock[index] = cancelada
    return cancelada
}