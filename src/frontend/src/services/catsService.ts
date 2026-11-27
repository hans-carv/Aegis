// src/services/catsService.ts
import { apiRequest } from './api'
import type { EstadoGato, SexoGato } from '../components/GatoCard'

export interface FelinoPublico {
    id: string
    codigoFelino: string
    nombre: string
    peso?: number
    talla?: string
    edadMeses: number
    temperamento?: string
    colorPelaje?: string
    sexo?: SexoGato
    estado: EstadoGato
    fotoUrl?: string
    historia?: string
}

export interface CreateGatoPayload {
    codigoFelino: string
    nombre: string
    peso: number
    talla?: string
    edadMeses: number
    temperamento?: string
    colorPelaje?: string
    sexo?: SexoGato
    estado?: EstadoGato
    fotoUrl?: string
    historia?: string
}

export interface GatoCompleto extends FelinoPublico {
    created_at?: string
    foto_url?: string
    codigo_felino?: string
    edad_meses?: number
    color_pelaje?: string
    esterilizado?: boolean
    resultadoVif?: string
    resultadoVilef?: string
    estadoMedico?: string
}

function normalizarGatoBackend(raw: any): GatoCompleto {
    return {
        ...raw,
        codigoFelino: raw.codigoFelino || raw.codigo_felino || '',
        edadMeses: raw.edadMeses ?? raw.edad_meses ?? 0,
        peso: raw.peso !== undefined && raw.peso !== null ? Number(raw.peso) : undefined,
        colorPelaje: raw.colorPelaje || raw.color_pelaje,
        fotoUrl: raw.fotoUrl || raw.foto_url,
        esterilizado: Boolean(raw.esterilizado),
        resultadoVif: raw.resultadoVif || raw.resultado_vif || 'NO_REALIZADO',
        resultadoVilef: raw.resultadoVilef || raw.resultado_vilef || 'NO_REALIZADO',
        estadoMedico: raw.estadoMedico || raw.estado_medico || 'SANO',
    }
}

export async function obtenerCatalogoPublico(): Promise<FelinoPublico[]> {
    const res = await apiRequest<{ ok: boolean; data: FelinoPublico[] }>('/public/cats')
    return res.data || []
}

export async function obtenerTodosLosGatos(): Promise<GatoCompleto[]> {
    const res = await apiRequest<{ ok: boolean; data: any[] }>('/gatos')
    return (res.data || []).map(normalizarGatoBackend)
}

export async function obtenerGatoPorCodigo(codigoOId: string): Promise<GatoCompleto> {
    const res = await apiRequest<{ ok: boolean; data: any }>(`/gatos/${codigoOId}`)
    return normalizarGatoBackend(res.data)
}

export async function crearGato(payload: CreateGatoPayload): Promise<GatoCompleto> {
    const res = await apiRequest<{ ok: boolean; message: string; data: GatoCompleto }>('/gatos', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    return res.data
}
