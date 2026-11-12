import type { FranjaHoraria, FranjaHorariaPayload } from '../types/horario'

let franjasMock: FranjaHoraria[] = [
    {
        id: 'franja-1',
        diaSemana: 'LUNES',
        horaInicio: '10:00',
        horaFin: '12:00',
        aforoMaximo: 10,
        activo: true,
    },
    {
        id: 'franja-2',
        diaSemana: 'LUNES',
        horaInicio: '15:00',
        horaFin: '17:00',
        aforoMaximo: 8,
        activo: false,
        motivoBloqueo: 'Limpieza profunda y desinfección de sala',
    },
    {
        id: 'franja-3',
        diaSemana: 'SABADO',
        horaInicio: '11:00',
        horaFin: '13:00',
        aforoMaximo: 12,
        activo: true,
    },
]

export async function listarFranjas(): Promise<FranjaHoraria[]> {
    await new Promise((resolve) => setTimeout(resolve, 400))
    return [...franjasMock]
}

export async function crearFranja(payload: FranjaHorariaPayload): Promise<FranjaHoraria> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const nueva: FranjaHoraria = {
        ...payload,
        id: `franja-${Date.now()}`,
    }
    franjasMock = [...franjasMock, nueva]
    return nueva
}

export async function actualizarFranja(id: string, payload: FranjaHorariaPayload): Promise<FranjaHoraria> {
    await new Promise((resolve) => setTimeout(resolve, 500))
    const actualizada: FranjaHoraria = { ...payload, id }
    franjasMock = franjasMock.map((f) => (f.id === id ? actualizada : f))
    return actualizada
}