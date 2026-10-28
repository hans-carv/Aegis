import { useState, useEffect } from 'react'
import GatoCard, { type EstadoGato } from '../../components/GatoCard'
import teoFoto from '../../assets/teo.jfif'

interface FelinoPublico {
    codigoFelino: string
    nombre: string
    peso: number
    talla: string
    edadMeses: number
    temperamento: string
    colorPelaje: string
    sexo: 'MACHO' | 'HEMBRA'
    estado: EstadoGato
    fotoUrl: string
    historia: string
}

/** Datos mock de felinos disponibles para adopción */
const MOCK_GATOS_DISPONIBLES: FelinoPublico[] = [
    {
        codigoFelino: 'CAT-PUB-01',
        nombre: 'Oliver',
        peso: 4.1,
        talla: 'Mediano',
        edadMeses: 12,
        temperamento: 'Cariñoso y tranquilo',
        colorPelaje: 'Naranja',
        sexo: 'MACHO',
        estado: 'DISPONIBLE',
        fotoUrl: teoFoto,
        historia: 'Rescatado de cachorro, busca un hogar amoroso y paciente.',
    },
    {
        codigoFelino: 'CAT-PUB-02',
        nombre: 'Mía',
        peso: 3.5,
        talla: 'Pequeño',
        edadMeses: 8,
        temperamento: 'Juguetona y curiosa',
        colorPelaje: 'Calicó',
        sexo: 'HEMBRA',
        estado: 'DISPONIBLE',
        fotoUrl: teoFoto,
        historia: 'Le encantan las pelotas de lana y dormir bajo el sol.',
    },
    {
        codigoFelino: 'CAT-PUB-03',
        nombre: 'Simba',
        peso: 3.9,
        talla: 'Mediano',
        edadMeses: 24,
        temperamento: 'Sociable',
        colorPelaje: 'Rubio',
        sexo: 'MACHO',
        estado: 'ADOPCION',
        fotoUrl: teoFoto,
        historia: 'Un gato ronroneador que se lleva excelente con otros animales.',
    },
]

export default function PublicCatalog() {
    const [gatos, setGatos] = useState<FelinoPublico[]>([])
    const [cargando, setCargando] = useState(true)
    const [busqueda, setBusqueda] = useState('')

    useEffect(() => {
        // Simulación de respuesta de API
        const timer = setTimeout(() => {
            setGatos(MOCK_GATOS_DISPONIBLES)
            setCargando(false)
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

    function handleAdoptar(codigo: string) {
        alert(`¡Gracias por tu interés en adoptar a (${codigo})! Por favor visítanos en Teo Cat Café o comunícate con la administración.`)
    }

    const gatosFiltrados = gatos.filter((g) =>
        g.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        g.temperamento.toLowerCase().includes(busqueda.toLowerCase())
    )

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8">
            {/* Encabezado del Catálogo */}
            <header className="mb-8 text-center sm:text-left">
                <h1 className="font-heading text-3xl font-extrabold text-marino sm:text-4xl">
                    Nuestros gatitos en adopción
                </h1>
                <p className="mt-2 text-sm text-marino/70 sm:text-base max-w-2xl">
                    Conoce a los felinos que se encuentran listos para integrarse a una nueva familia. Todos cuentan con revisión médica inicial y protocolo de vacunas.
                </p>

                {/* Búsqueda rápida */}
                <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Buscar por nombre o temperamento..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full rounded-xl border border-marino/30 bg-white px-4 py-2.5 text-sm outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                        />
                    </div>
                    <p className="text-xs font-semibold text-cafe">
                        Mostrando {gatosFiltrados.length} gatitos disponibles
                    </p>
                </div>
            </header>

            {/* Indicador de Carga (Skeletons) */}
            {cargando ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-96 animate-pulse rounded-2xl bg-beige/30" />
                    ))}
                </div>
            ) : gatosFiltrados.length === 0 ? (
                /* Mensaje cuando no existan gatos */
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-beige bg-white p-12 text-center">
                    <svg className="h-16 w-16 text-cafe/40 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 8v4M12 16v.01" />
                    </svg>
                    <h3 className="font-heading text-xl font-bold text-marino">No se encontraron gatitos</h3>
                    <p className="mt-1 text-sm text-marino/70 max-w-md">
                        En este momento no hay felinos disponibles con ese criterio de búsqueda o están en periodo de cuarentena.
                    </p>
                </div>
            ) : (
                /* Grilla de Cards */
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {gatosFiltrados.map((gato) => (
                        <GatoCard
                            key={gato.codigoFelino}
                            codigoFelino={gato.codigoFelino}
                            nombre={gato.nombre}
                            peso={gato.peso}
                            talla={gato.talla}
                            edadMeses={gato.edadMeses}
                            temperamento={gato.temperamento}
                            colorPelaje={gato.colorPelaje}
                            sexo={gato.sexo}
                            estado={gato.estado}
                            fotoUrl={gato.fotoUrl}
                            historia={gato.historia}
                            modoPublico={true}
                            onAdoptar={handleAdoptar}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}