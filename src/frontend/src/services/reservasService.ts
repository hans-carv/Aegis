import { apiRequest } from './api'
import type {
    CrearReservaPayload,
    DisponibilidadFranja,
    ReservaUsuario,
} from '../types/reserva'

export class ReservaApiError extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

function normalizarHora(hora?: string): string {
    if (!hora) return ''
    return hora.length > 5 ? hora.slice(0, 5) : hora
}

function normalizarFecha(fecha?: string): string {
    if (!fecha) return ''
    return fecha.includes('T') ? fecha.split('T')[0] : fecha
}

export async function consultarDisponibilidad(fecha: string): Promise<DisponibilidadFranja[]> {
    try {
        const res = await apiRequest<{ ok: boolean; data: DisponibilidadFranja[] }>(
            `/reservas/disponibilidad?fecha=${encodeURIComponent(fecha)}`
        )
        return (res.data || []).map((turno) => ({
            ...turno,
            horaInicio: normalizarHora(turno.horaInicio),
            horaFin: normalizarHora(turno.horaFin),
        }))
    } catch (err: any) {
        throw new ReservaApiError(err.status || 500, err.message || 'Error al consultar disponibilidad.')
    }
}

export async function crearReserva(
    payload: CrearReservaPayload
): Promise<{ reserva: ReservaUsuario; cuposRestantes: number }> {
    try {
        const res = await apiRequest<{
            ok: boolean
            data: {
                reserva: any
                cuposRestantesDespuesDeReserva?: number
            }
        }>('/reservas', {
            method: 'POST',
            body: JSON.stringify({
                franjaId: payload.franjaId,
                fechaReserva: payload.fechaReserva,
                cantidadPersonas: payload.cantidadPersonas ?? 1,
            }),
        })

        const r = res.data.reserva
        const reserva: ReservaUsuario = {
            id: r.id,
            fechaReserva: normalizarFecha(r.fechaReserva),
            horaInicio: normalizarHora(r.horaInicio),
            horaFin: normalizarHora(r.horaFin),
            cantidadPersonas: Number(r.cantidadPersonas || 1),
            estado: r.estado,
        }

        return {
            reserva,
            cuposRestantes: res.data.cuposRestantesDespuesDeReserva ?? 0,
        }
    } catch (err: any) {
        throw new ReservaApiError(err.status || 500, err.message || 'Error al procesar reserva.')
    }
}

export async function listarMisReservas(): Promise<ReservaUsuario[]> {
    try {
        const res = await apiRequest<{ ok: boolean; data: any[] }>('/reservas/mis-reservas')
        return (res.data || []).map((r) => ({
            id: r.id,
            fechaReserva: normalizarFecha(r.fechaReserva),
            horaInicio: normalizarHora(r.horaInicio),
            horaFin: normalizarHora(r.horaFin),
            cantidadPersonas: Number(r.cantidadPersonas || 1),
            estado: r.estado,
        }))
    } catch (err: any) {
        throw new ReservaApiError(err.status || 500, err.message || 'Error al listar reservas.')
    }
}
