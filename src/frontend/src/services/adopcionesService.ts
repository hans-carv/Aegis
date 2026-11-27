import { apiRequest, getAuthToken } from './api'
import type {
    AdopcionFormalItem,
    ContratoFirmadoResponse,
    FichaAdministrativaGato,
    VincularAdopcionDto,
    VincularAdopcionResponse,
} from '../types/adopcion'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

interface ApiEnvelope<T> {
    ok: boolean
    mensaje?: string
    data: T
}

/**
 * POST /api/admin/adopciones/vincular
 * Consolida la adopción definitiva, crea el vínculo en adopciones_formales y marca al felino como ADOPTADO.
 */
export async function vincularAdopcionFormal(
    dto: VincularAdopcionDto
): Promise<VincularAdopcionResponse> {
    const res = await apiRequest<ApiEnvelope<VincularAdopcionResponse>>(
        '/admin/adopciones/vincular',
        {
            method: 'POST',
            body: JSON.stringify(dto),
        }
    )
    return res.data
}

/**
 * GET /api/admin/cats/:id/ficha
 * Obtiene la ficha administrativa del gato junto con su Propietario / Adoptante Legal Actual.
 */
export async function obtenerFichaAdministrativaGato(
    gatoId: string
): Promise<FichaAdministrativaGato> {
    const res = await apiRequest<ApiEnvelope<FichaAdministrativaGato>>(
        `/admin/cats/${encodeURIComponent(gatoId)}/ficha`
    )
    return res.data
}

/**
 * GET /api/admin/adopciones
 * Lista el directorio de adopciones formales / propietarios legales vigentes.
 */
export async function listarAdopcionesFormales(): Promise<AdopcionFormalItem[]> {
    const res = await apiRequest<ApiEnvelope<AdopcionFormalItem[]>>('/admin/adopciones')
    return Array.isArray(res.data) ? res.data : []
}

/**
 * GET /api/admin/adopciones/:id/contrato-pdf
 * Descarga/abre el contrato legal en formato PDF generado por el backend (pdfkit).
 */
export async function descargarContratoPdf(
    adopcionIdOrPostulacionId: string
): Promise<{ blobUrl: string; filename: string }> {
    const token = getAuthToken()
    const response = await fetch(
        `${API_BASE_URL}/admin/adopciones/${encodeURIComponent(adopcionIdOrPostulacionId)}/contrato-pdf`,
        {
            method: 'GET',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        }
    )

    if (!response.ok) {
        let mensaje = `Error ${response.status} al generar el contrato PDF.`
        try {
            const errJson = await response.json()
            if (errJson?.message) mensaje = errJson.message
        } catch {
            // Ignorar si no es JSON
        }
        throw new Error(mensaje)
    }

    const blob = await response.blob()
    const contentDisposition = response.headers.get('Content-Disposition') || ''
    const match = /filename="?([^";]+)"?/i.exec(contentDisposition)
    const filename = match?.[1] || `Contrato_Adopcion_${adopcionIdOrPostulacionId.slice(0, 8)}.pdf`
    const blobUrl = URL.createObjectURL(blob)

    return { blobUrl, filename }
}

/**
 * POST /api/admin/adopciones/:id/contrato-firmado
 * Registra el contrato firmado digitalmente o escaneado (archivo multipart o URL).
 */
export async function subirContratoFirmado(
    adopcionId: string,
    payload: { archivo?: File; contratoFirmadoUrl?: string }
): Promise<ContratoFirmadoResponse> {
    const token = getAuthToken()

    if (payload.archivo) {
        const formData = new FormData()
        formData.append('contrato', payload.archivo)

        const response = await fetch(
            `${API_BASE_URL}/admin/adopciones/${encodeURIComponent(adopcionId)}/contrato-firmado`,
            {
                method: 'POST',
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            }
        )

        const json = await response.json().catch(() => null)
        if (!response.ok) {
            throw new Error(json?.message || `Error ${response.status} al subir el contrato firmado.`)
        }
        return json.data
    }

    const res = await apiRequest<ApiEnvelope<ContratoFirmadoResponse>>(
        `/admin/adopciones/${encodeURIComponent(adopcionId)}/contrato-firmado`,
        {
            method: 'POST',
            body: JSON.stringify({ contratoFirmadoUrl: payload.contratoFirmadoUrl }),
        }
    )
    return res.data
}
