import { apiRequest, getAuthToken } from './api'
import type {
    CancelarPostulacionPayload,
    CrearPostulacionPayload,
    DocumentosPostulacionFiles,
    PostulacionRegistrada,
    NombreCampoDocumento,
    PostulacionAdmin,
    EstadoPostulacion,
} from '../types/postulacion'

export class PostulacionApiError extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB
const TIPOS_PERMITIDOS = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

export async function crearPostulacion(
    payload: CrearPostulacionPayload,
    _solicitanteContexto?: { nombre?: string; email?: string }
): Promise<PostulacionRegistrada> {
    try {
        const body = {
            gatoId: payload.gatoId,
            presupuestoMensual: Number(payload.presupuestoMensual),
            telefonoContacto: payload.telefonoContacto.trim(),
            direccionDomicilio: payload.direccionDomicilio.trim(),
            cuestionario: {
                tieneMallasProteccion: Boolean(payload.tieneMallasProteccion),
                permisoPropietario: Boolean(payload.permisoPropietario),
                compromisoTenenciaResponsable: Boolean(payload.compromisoTenenciaResponsable),
                otrosAnimalesEnCasa: payload.otrosAnimalesEnCasa?.trim() || 'Ninguno',
                tiempoSoloAlDiaHoras: Number(payload.tiempoSoloAlDiaHoras || 0),
            },
        }

        const res = await apiRequest<{ ok: boolean; data: any }>('/postulaciones', {
            method: 'POST',
            body: JSON.stringify(body),
        })

        const data = res.data
        return {
            ...payload,
            id: data.id,
            fechaPostulacion: data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            estado: data.estado || 'EN_REVISION',
            documentacion_completa: Boolean(data.documentacionCompleta),
        }
    } catch (err: any) {
        throw new PostulacionApiError(err.status || 500, err.message || 'Error al registrar postulación.')
    }
}

export async function subirDocumentosPostulacion(
    postulacionId: string,
    archivos: DocumentosPostulacionFiles
): Promise<PostulacionAdmin> {
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

    const token = getAuthToken()
    const formData = new FormData()
    formData.append('carnetIdentidad', archivos.carnetIdentidad)
    formData.append('facturaServicio', archivos.facturaServicio)
    formData.append('croquisDomicilio', archivos.croquisDomicilio)

    const response = await fetch(`/api/postulaciones/${postulacionId}/documentos`, {
        method: 'POST',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
    })

    const json = await response.json().catch(() => ({}))
    if (!response.ok) {
        throw new PostulacionApiError(response.status, json.message || 'Error al subir documentos cifrados.')
    }

    return {
        id: postulacionId,
        gatoId: '',
        felinoNombre: '',
        postulanteNombre: '',
        postulanteEmail: '',
        fechaPostulacion: new Date().toISOString().split('T')[0],
        estado: 'PENDIENTE_REVISION',
        documentacion_completa: true,
        presupuestoMensual: 0,
        telefonoContacto: '',
        direccionDomicilio: '',
        tieneMallasProteccion: true,
        permisoPropietario: true,
        compromisoTenenciaResponsable: true,
        documentos: [
            { campo: 'carnetIdentidad', etiqueta: 'Cédula de identidad', cargado: true, tipoMime: archivos.carnetIdentidad.type as any, nombreArchivo: archivos.carnetIdentidad.name },
            { campo: 'facturaServicio', etiqueta: 'Comprobante de servicios básicos', cargado: true, tipoMime: archivos.facturaServicio.type as any, nombreArchivo: archivos.facturaServicio.name },
            { campo: 'croquisDomicilio', etiqueta: 'Croquis del domicilio', cargado: true, tipoMime: archivos.croquisDomicilio.type as any, nombreArchivo: archivos.croquisDomicilio.name },
        ],
    }
}

export async function listarMisPostulaciones(
    emailUsuario?: string
): Promise<PostulacionRegistrada[]> {
    try {
        const res = await apiRequest<{ ok: boolean; data: PostulacionRegistrada[] }>('/postulaciones/mis-postulaciones')
        return res.data || []
    } catch {
        try {
            const todas = await listarPostulacionesAdmin()
            if (!emailUsuario) return todas
            return todas.filter(
                (p) => p.postulanteEmail?.toLowerCase() === emailUsuario.toLowerCase()
            )
        } catch {
            return []
        }
    }
}

export async function listarPostulacionesAdmin(): Promise<PostulacionAdmin[]> {
    try {
        const res = await apiRequest<{ ok: boolean; data: any[] }>('/postulaciones/admin')
        const items = res.data || []
        return items.map((p) => {
            const estado = (p.estado === 'EN_REVISION' ? 'PENDIENTE_REVISION' : (p.estado || 'PENDIENTE_REVISION')) as EstadoPostulacion
            return {
                ...p,
                estado,
                felinoNombre: p.felinoNombre || p.gatoNombre || 'Felino',
                gatoId: p.codigoFelino || p.codigo_felino || p.gatoId || '',
                fechaPostulacion: p.fechaPostulacion || (p.createdAt ? new Date(p.createdAt).toISOString().split('T')[0] : ''),
                documentacion_completa: Boolean(p.documentacion_completa ?? p.documentacionCompleta),
            }
        })
    } catch (err: any) {
        throw new PostulacionApiError(err.status || 500, err.message || 'Error al listar postulaciones.')
    }
}

export async function obtenerDocumentoSeguroBlob(
    postulacionId: string,
    campo: NombreCampoDocumento,
    _esAdmin: boolean
): Promise<{ blob: Blob; tipoMime: string; nombreArchivo: string }> {
    const token = getAuthToken()
    const url = `/api/postulaciones/admin/visor-postulacion/${encodeURIComponent(postulacionId)}/${encodeURIComponent(campo)}`

    const response = await fetch(url, {
        method: 'GET',
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
    })

    if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}))
        throw new PostulacionApiError(
            response.status,
            errorJson.message || `Error ${response.status}: no se pudo obtener el documento protegido.`
        )
    }

    const tipoMime = response.headers.get('content-type') || 'application/octet-stream'
    const disposition = response.headers.get('content-disposition') || ''
    const match = disposition.match(/filename="?([^"]+)"?/)
    const nombreArchivo = match ? match[1] : `${campo}.pdf`

    const blob = await response.blob()
    return { blob, tipoMime, nombreArchivo }
}

export async function cancelarPostulacion(
    postulacionId: string,
    payload: CancelarPostulacionPayload,
    _contextoActor?: { rol: 'ADMIN' | 'USUARIO'; emailUsuario?: string }
): Promise<PostulacionAdmin> {
    try {
        const motivo = payload.motivo_baja?.trim()
        if (!motivo) {
            throw new PostulacionApiError(400, 'El motivo de cancelación es obligatorio.')
        }

        const res = await apiRequest<{ ok: boolean; mensaje: string; data: any }>(
            `/postulaciones/${postulacionId}/cancelar`,
            {
                method: 'PATCH',
                body: JSON.stringify({
                    motivo,
                    motivo_baja: motivo,
                }),
            }
        )

        return res.data
    } catch (err: any) {
        throw new PostulacionApiError(err.status || 500, err.message || 'Error al cancelar postulación.')
    }
}
