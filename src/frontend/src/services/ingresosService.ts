// src/services/ingresosService.ts
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
    peso?: number
    talla?: string
    edadMeses?: number
    temperamento?: string
    colorPelaje?: string
    sexo?: Sexo
    estado?: string
    fotoUrl?: string
    historia?: string
}

// Desactivamos la simulación para ir a la base de datos real
export const MODO_DEMOSTRACION: boolean = false

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export class IngresoError extends Error {
    name = 'IngresoError'
    constructor(mensaje: string) {
        super(mensaje)
    }
}

function obtenerToken(): string | null {
    return localStorage.getItem('teo_auth_token')
}

/**
 * Consulta la lista real de gatos dados de alta en PostgreSQL (GET /api/gatos)
 */
export async function obtenerGatosParaIngreso(): Promise<GatoOpcion[]> {
    try {
        const token = obtenerToken()
        const response = await fetch(`${API_URL}/gatos`, {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        })

        if (!response.ok) {
            throw new IngresoError(`Error ${response.status}: no se pudo cargar la lista de felinos.`)
        }

        const json = await response.json()
        const lista = json.data || []

        return lista.map((g: any) => ({
            id: g.id,
            codigo: g.codigo_felino,
            nombre: g.nombre,
            peso: Number(g.peso),
            talla: g.talla,
            edadMeses: g.edad_meses,
            temperamento: g.temperamento,
            colorPelaje: g.color_pelaje,
            sexo: g.sexo,
            estado: g.estado,
            fotoUrl: g.foto_url,
            historia: g.historia,
        }))
    } catch (err: any) {
        if (err instanceof IngresoError) throw err
        throw new IngresoError(err.message || 'Error de conexión con el servidor')
    }
}

/**
 * Registra formalmente el ingreso en la base de datos (POST /api/ingresos)
 */
export async function enviarIngreso(payload: CreateIngresoPayload): Promise<void> {
    try {
        const token = obtenerToken()
        const response = await fetch(`${API_URL}/ingresos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(payload),
        })

        const resData = await response.json()

        if (!response.ok) {
            throw new IngresoError(resData.message || `Error al guardar el ingreso (${response.status})`)
        }
    } catch (err: any) {
        if (err instanceof IngresoError) throw err
        throw new IngresoError(err.message || 'Error de conexión al registrar el ingreso')
    }
}