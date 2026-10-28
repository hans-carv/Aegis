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
}

export async function obtenerCatalogoPublico(): Promise<FelinoPublico[]> {
    const res = await apiRequest<{ ok: boolean; data: FelinoPublico[] }>('/public/cats')
    return res.data || []
}

export async function obtenerTodosLosGatos(): Promise<GatoCompleto[]> {
    const res = await apiRequest<{ ok: boolean; data: GatoCompleto[] }>('/gatos')
    return res.data || []
}

export async function obtenerGatoPorCodigo(codigoOId: string): Promise<GatoCompleto> {
    const res = await apiRequest<{ ok: boolean; data: GatoCompleto }>(`/gatos/${codigoOId}`)
    return res.data
}

export async function crearGato(payload: CreateGatoPayload): Promise<GatoCompleto> {
    const res = await apiRequest<{ ok: boolean; message: string; data: GatoCompleto }>('/gatos', {
        method: 'POST',
        body: JSON.stringify(payload),
    })
    return res.data
}
