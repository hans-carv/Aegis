import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router'
import GatoCard, { type EstadoGato, type SexoGato } from '../../components/GatoCard'
import teoFoto from '../../assets/teo.jfif'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface FelinoPublico {
    id?: string
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

export default function PublicCatalog() {
    const [gatos, setGatos] = useState<FelinoPublico[]>([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busqueda, setBusqueda] = useState('')

    useEffect(() => {
        let activo = true

        async function cargarCatalogo() {
            setCargando(true)
            setError(null)

            try {
                // Llamada pública sin Authorization header (DoD SCRUM-32 / SCRUM-34)
                const res = await fetch(`${API_URL}/public/cats`)

                if (!res.ok) {
                    throw new Error(`Error ${res.status}: no se pudo cargar el catálogo público.`)
                }

                const json = await res.json()
                if (activo) {
                    setGatos(json.data || [])
                }
            } catch (err: any) {
                if (activo) {
                    setError(err.message || 'Error de conexión con el servidor')
                }
            } finally {
                if (activo) {
                    setCargando(false)
                }
            }
        }

        cargarCatalogo()

        return () => {
            activo = false
        }
    }, [])
    
    const navigate = useNavigate()

    function handleAdoptar(codigo: string) {
        navigate(`/adoptar/${codigo}`)
    }

    // Filtrado seguro contra valores nulos o indefinidos
    const gatosFiltrados = gatos.filter((g) => {
        const query = busqueda.toLowerCase().trim()
        if (!query) return true

        const coincideNombre = g.nombre?.toLowerCase().includes(query) ?? false
        const coincideTemperamento = g.temperamento?.toLowerCase().includes(query) ?? false
        const coincidePelaje = g.colorPelaje?.toLowerCase().includes(query) ?? false

        return coincideNombre || coincideTemperamento || coincidePelaje
    })

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8">
            <header className="mb-8 space-y-4">
                <div className="flex flex-col gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-cafe">Catálogo en Adopción</span>
                    <h1 className="font-heading text-3xl font-extrabold tracking-tight text-marino sm:text-4xl">
                        Nuestros Felinos Residentes
                    </h1>
                    <p className="max-w-2xl text-sm leading-relaxed text-marino/80 sm:text-base">
                        Conoce a los gatitos que están buscando un hogar responsable y amoroso. Cada uno tiene una
                        historia y una personalidad única.
                    </p>
                </div>

                {/* Filtro y Contador */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-beige/60 pt-4">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, temperamento o pelaje..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full rounded-xl border border-marino/30 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                        />
                    </div>
                    <p className="text-xs font-semibold text-cafe">
                        Mostrando {gatosFiltrados.length} de {gatos.length} felinos disponibles
                    </p>
                </div>
            </header>

            {/* Manejo de error de conexión */}
            {!cargando && error && (
                <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                    <p className="font-sans text-sm font-medium text-red-600">{error}</p>
                    <p className="mt-1 text-xs text-red-400">Verifica que el backend esté corriendo en el puerto 3000.</p>
                </div>
            )}

            {/* Indicador de Carga (Skeletons - SCRUM-34) */}
            {cargando ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-96 animate-pulse rounded-2xl bg-beige/30" />
                    ))}
                </div>
            ) : gatosFiltrados.length === 0 ? (
                /* Mensaje para catálogo vacío - SCRUM-34 */
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-beige bg-white p-12 text-center">
                    <svg
                        className="h-16 w-16 text-cafe/40 mb-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <path d="M12 8v4M12 16v.01" />
                    </svg>
                    <h3 className="font-heading text-lg font-bold text-marino">No encontramos felinos</h3>
                    <p className="mt-1 text-sm text-marino/70">
                        {busqueda ? 'No hay gatos que coincidan con tu búsqueda.' : 'No hay gatos disponibles para adopción en este momento.'}
                    </p>
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {gatosFiltrados.map((gato) => (
                        <GatoCard
                            key={gato.codigoFelino}
                            codigoFelino={gato.codigoFelino}
                            nombre={gato.nombre}
                            peso={Number(gato.peso) || 0}
                            talla={gato.talla}
                            edadMeses={gato.edadMeses}
                            temperamento={gato.temperamento || 'Sociable'}
                            colorPelaje={gato.colorPelaje}
                            sexo={gato.sexo}
                            estado={gato.estado}
                            fotoUrl={gato.fotoUrl || (gato as any).foto_url || teoFoto}
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
