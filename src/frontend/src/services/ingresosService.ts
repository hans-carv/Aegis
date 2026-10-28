import { apiRequest } from './api'

export type ViaProcedencia = 'RESCATADO' | 'FUNDACION' | 'PARTICULAR'
export type Sexo = 'MACHO' | 'HEMBRA'

export type CreateIngresoPayload = {
    gatoId?: string
    nombreGato?: string
    edadMeses?: number
    sexo?: Sexo
    colorPelaje?: string
    viaProcedencia: ViaProcedencia
    nombreInstitucion?: string
    fechaDerivacion?: string
    observaciones?: string
}

export type GatoOpcion = {
    id: string
    codigo: string
    nombre: string
}

// Ahora conectado al servidor en modo real por defecto
export const MODO_DEMOSTRACION: boolean = false

export class IngresoError extends Error {
    name = 'IngresoError'
    constructor(mensaje: string) {
        super(mensaje)
        this.name = 'IngresoError'
    }
}

function esperar(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

const GATOS_DE_PRUEBA: GatoOpcion[] = [
    { id: 'demo-oliver', codigo: 'CAT-PUB-01', nombre: 'Oliver' },
    { id: 'demo-mia', codigo: 'CAT-PUB-02', nombre: 'Mía' },
    { id: 'demo-thor', codigo: 'CAT-PUB-03', nombre: 'Thor' },
    { id: 'demo-bella', codigo: 'CAT-PUB-04', nombre: 'Bella' },
]

export async function obtenerGatosParaIngreso(): Promise<GatoOpcion[]> {
    if (MODO_DEMOSTRACION) {
        await esperar(400)
        return GATOS_DE_PRUEBA
    }

    try {
        const res = await apiRequest<{ ok: boolean; data: any[] }>('/gatos')
        const gatos = res.data || []
        return gatos.map((cat: any) => ({
            id: cat.id,
            codigo: cat.codigo_felino || cat.codigoFelino || cat.id,
            nombre: cat.nombre,
        }))
    } catch (err: any) {
        throw new IngresoError(err.message || 'Error al obtener la lista de gatos desde el servidor.')
    }
}

export async function enviarIngreso(payload: CreateIngresoPayload): Promise<void> {
    if (MODO_DEMOSTRACION) {
        void payload
        await esperar(900)
        return
    }

    try {
        await apiRequest('/ingresos', {
            method: 'POST',
            body: JSON.stringify(payload),
        })
    } catch (err: any) {
        throw new IngresoError(err.message || 'Error al registrar el ingreso en el servidor.')
    }
}
