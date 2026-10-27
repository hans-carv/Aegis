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

// con 'true' se simula la conexión al backend; con 'false' se debe implementar la conexión real.

export const MODO_DEMOSTRACION: boolean = true

export class IngresoError extends Error {
    name = 'IngresoError'
}

function esperar(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms))
}

//Gatos de prueba para el selector de gatos. Se usan solo en modo demostración.
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
    throw new IngresoError('La lista de gatos aún no esta conectada al servidor')
}

export async function enviarIngreso(payload: CreateIngresoPayload): Promise<void> {
    if (MODO_DEMOSTRACION) {
        // simula la latencia de red
        void payload
        await esperar(900)
        return
    }

    // aca va la implementación real de la conexión al backend para registrar un ingreso
    throw new IngresoError('La conexión con el servidor aún no esta implementada')
}