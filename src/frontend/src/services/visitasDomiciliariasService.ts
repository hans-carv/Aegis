import { apiRequest } from './api'
import type {
    CreateVisitaDomiciliariaDto,
    EmitirDictamenDto,
    VisitaDomiciliaria,
} from '../types/visitaDomiciliaria'

interface ApiEnvelope<T> {
    ok: boolean
    mensaje?: string
    data: T
}

/**
 * POST /api/admin/visitas-domiciliarias
 */
export async function agendarVisitaDomiciliaria(
    _adminId: string,
    dto: CreateVisitaDomiciliariaDto
): Promise<VisitaDomiciliaria> {
    const res = await apiRequest<ApiEnvelope<{ visita: VisitaDomiciliaria }>>(
        '/admin/visitas-domiciliarias',
        {
            method: 'POST',
            body: JSON.stringify(dto),
        }
    )
    return res.data.visita
}

/**
 * GET /api/admin/visitas-domiciliarias?fecha=YYYY-MM-DD
 */
export async function listarAgendaVisitas(fecha?: string): Promise<VisitaDomiciliaria[]> {
    const query = fecha ? `?fecha=${encodeURIComponent(fecha)}` : ''
    const res = await apiRequest<ApiEnvelope<VisitaDomiciliaria[]>>(
        `/admin/visitas-domiciliarias${query}`
    )
    return Array.isArray(res.data) ? res.data : []
}

/**
 * Busca la visita asociada a una postulación dentro de la agenda
 */
export async function obtenerVisitaPorPostulacion(
    postulacionId: string
): Promise<VisitaDomiciliaria | null> {
    const visitas = await listarAgendaVisitas()
    return visitas.find((v) => v.postulacionId === postulacionId) || null
}

/**
 * PATCH /api/admin/visitas-domiciliarias/:id/dictamen
 */
export async function emitirDictamenVisita(
    visitaId: string,
    dto: EmitirDictamenDto
): Promise<VisitaDomiciliaria> {
    const res = await apiRequest<ApiEnvelope<{ visita: VisitaDomiciliaria }>>(
        `/admin/visitas-domiciliarias/${visitaId}/dictamen`,
        {
            method: 'PATCH',
            body: JSON.stringify(dto),
        }
    )
    return res.data.visita
}

/**
 * POST /api/visitas-domiciliarias/:id/evidencias
 */
export async function registrarEvidenciaAdecuacion(
    visitaId: string,
    _emailUsuarioAutenticado: string | undefined,
    evidenciaUrls: string[]
): Promise<VisitaDomiciliaria> {
    const res = await apiRequest<ApiEnvelope<VisitaDomiciliaria>>(
        `/visitas-domiciliarias/${visitaId}/evidencias`,
        {
            method: 'POST',
            body: JSON.stringify({ evidenciaUrls }),
        }
    )
    return res.data
}

/**
 * POST /api/admin/postulaciones/:postulacionId/contrato
 */
export async function validarHabilitadoParaContrato(postulacionId: string): Promise<{
    habilitadoContrato: boolean
    postulacionId: string
    dictamen: string
}> {
    const res = await apiRequest<
        ApiEnvelope<{ habilitadoContrato: boolean; postulacionId: string; dictamen: string }>
    >(`/admin/postulaciones/${postulacionId}/contrato`, {
        method: 'POST',
    })
    return res.data
}