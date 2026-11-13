import { apiRequest } from './api'
import type { FranjaHoraria, FranjaHorariaPayload } from '../types/horario'

function normalizarHora(hora: string): string {
    if (!hora) return ''
    return hora.length > 5 ? hora.slice(0, 5) : hora
}

export async function listarFranjas(): Promise<FranjaHoraria[]> {
    const res = await apiRequest<{ ok: boolean; data: FranjaHoraria[] }>('/admin/horarios')
    return (res.data || []).map((f) => ({
        ...f,
        horaInicio: normalizarHora(f.horaInicio),
        horaFin: normalizarHora(f.horaFin),
    }))
}

export async function crearFranja(payload: FranjaHorariaPayload): Promise<FranjaHoraria> {
    const res = await apiRequest<{ ok: boolean; data: FranjaHoraria }>('/admin/horarios', {
        method: 'POST',
        body: JSON.stringify({
            diaSemana: payload.diaSemana,
            horaInicio: payload.horaInicio,
            horaFin: payload.horaFin,
            aforoMaximo: Number(payload.aforoMaximo),
        }),
    })
    return {
        ...res.data,
        horaInicio: normalizarHora(res.data.horaInicio),
        horaFin: normalizarHora(res.data.horaFin),
    }
}

export async function actualizarFranja(id: string, payload: FranjaHorariaPayload): Promise<FranjaHoraria> {
    const res = await apiRequest<{ ok: boolean; data: FranjaHoraria }>(`/admin/horarios/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            horaInicio: payload.horaInicio,
            horaFin: payload.horaFin,
            aforoMaximo: Number(payload.aforoMaximo),
            activo: payload.activo,
            motivoBloqueo: payload.motivoBloqueo,
        }),
    })
    return {
        ...res.data,
        horaInicio: normalizarHora(res.data.horaInicio),
        horaFin: normalizarHora(res.data.horaFin),
    }
}
