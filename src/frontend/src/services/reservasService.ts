import type {
    CrearReservaPayload,
    DisponibilidadFranja,
    ReservaUsuario,
} from '../types/reserva'
import type { DiaSemana } from '../types/horario'

export class ReservaApiError extends Error {
    status: number
    constructor(status: number, message: string) {
        super(message)
        this.status = status
    }
}

const DIAS_MAP: DiaSemana[] = [
    'DOMINGO',
    'LUNES',
    'MARTES',
    'MIERCOLES',
    'JUEVES',
    'VIERNES',
    'SABADO',
]

function obtenerDiaSemana(fechaYYYYMMDD: string): DiaSemana {
    const [y, m, d] = fechaYYYYMMDD.split('-').map(Number)
    const fecha = new Date(y, m - 1, d)
    return DIAS_MAP[fecha.getDay()]
}

// Base simulada de reservas del usuario logueado
let misReservasMock: ReservaUsuario[] = [
    {
        id: 'res-01',
        fechaReserva: '2026-11-20',
        horaInicio: '10:00',
        horaFin: '12:00',
        cantidadPersonas: 2,
        estado: 'CONFIRMADA',
    },
    {
        id: 'res-02',
        fechaReserva: '2026-10-15',
        horaInicio: '15:00',
        horaFin: '17:00',
        cantidadPersonas: 1,
        estado: 'COMPLETADA',
    },
]

// Cupos ocupados simulados por fecha + franjaId
const ocupacionSimulada: Record<string, number> = {}

export async function consultarDisponibilidad(fecha: string): Promise<DisponibilidadFranja[]> {
    await new Promise((resolve) => setTimeout(resolve, 450))

    const diaSemana = obtenerDiaSemana(fecha)

    // Simulamos que los domingos no hay turnos configurados
    if (diaSemana === 'DOMINGO') return []

    const plantillas = [
        {
            franjaId: 'franja-10-12',
            horaInicio: '10:00',
            horaFin: '12:00',
            aforoMaximo: 10,
            ocupadosBase: 3,
            activo: true,
        },
        {
            franjaId: 'franja-14-16',
            horaInicio: '14:00',
            horaFin: '16:00',
            aforoMaximo: 8,
            ocupadosBase: 8, // Agotado
            activo: true,
        },
        {
            franjaId: 'franja-16-18',
            horaInicio: '16:00',
            horaFin: '18:00',
            aforoMaximo: 10,
            ocupadosBase: 0,
            activo: false,
            motivoBloqueo: 'Jornada de vacunación y control veterinario',
        },
        {
            franjaId: 'franja-18-20',
            horaInicio: '18:00',
            horaFin: '20:00',
            aforoMaximo: 6,
            ocupadosBase: 4,
            activo: true,
        },
    ]

    return plantillas.map((p) => {
        const extra = ocupacionSimulada[`${fecha}_${p.franjaId}`] || 0
        const cuposOcupados = Math.min(p.aforoMaximo, p.ocupadosBase + extra)
        const cuposDisponibles = Math.max(0, p.aforoMaximo - cuposOcupados)
        const disponible = p.activo && cuposDisponibles > 0

        return {
            franjaId: p.franjaId,
            diaSemana,
            horaInicio: p.horaInicio,
            horaFin: p.horaFin,
            aforoMaximo: p.aforoMaximo,
            cuposOcupados,
            cuposDisponibles,
            activo: p.activo,
            motivoBloqueo: p.motivoBloqueo,
            disponible,
        }
    })
}

export async function crearReserva(
    payload: CrearReservaPayload
): Promise<{ reserva: ReservaUsuario; cuposRestantes: number }> {
    await new Promise((resolve) => setTimeout(resolve, 600))

    const cantidad = payload.cantidadPersonas ?? 1
    if (cantidad <= 0) {
        throw new ReservaApiError(400, 'La cantidad de personas debe ser al menos 1.')
    }

    const turnos = await consultarDisponibilidad(payload.fechaReserva)
    const turno = turnos.find((t) => t.franjaId === payload.franjaId)

    if (!turno) {
        throw new ReservaApiError(404, 'La franja horaria seleccionada no existe.')
    }

    if (!turno.activo) {
        throw new ReservaApiError(400, 'Este turno se encuentra bloqueado y no admite reservas.')
    }

    // Validar si el usuario ya tiene reserva activa en misma fecha y hora
    const yaTieneReserva = misReservasMock.some(
        (r) =>
            r.fechaReserva === payload.fechaReserva &&
            r.horaInicio === turno.horaInicio &&
            r.estado === 'CONFIRMADA'
    )

    if (yaTieneReserva) {
        throw new ReservaApiError(
            409,
            'Ya tienes una reserva activa para esta misma fecha y horario.'
        )
    }

    if (turno.cuposDisponibles < cantidad) {
        throw new ReservaApiError(
            409,
            'La disponibilidad ha cambiado y ya no quedan suficientes cupos en este turno.'
        )
    }

    // Registrar ocupación y nueva reserva
    const key = `${payload.fechaReserva}_${payload.franjaId}`
    ocupacionSimulada[key] = (ocupacionSimulada[key] || 0) + cantidad

    const nuevaReserva: ReservaUsuario = {
        id: `res-${Date.now()}`,
        fechaReserva: payload.fechaReserva,
        horaInicio: turno.horaInicio,
        horaFin: turno.horaFin,
        cantidadPersonas: cantidad,
        estado: 'CONFIRMADA',
    }

    misReservasMock = [nuevaReserva, ...misReservasMock]

    return {
        reserva: nuevaReserva,
        cuposRestantes: turno.cuposDisponibles - cantidad,
    }
}

export async function listarMisReservas(): Promise<ReservaUsuario[]> {
    await new Promise((resolve) => setTimeout(resolve, 450))
    return [...misReservasMock]
}