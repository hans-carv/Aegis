import { useState, useEffect, useCallback } from 'react'
import GatoCard, { type EstadoGato, type SexoGato } from '../../components/GatoCard'
import { obtenerCatalogoPublico, type FelinoPublico } from '../../services/catsService'

export default function PublicCatalog() {
    const [gatos, setGatos] = useState<FelinoPublico[]>([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busqueda, setBusqueda] = useState('')

    const cargarGatos = useCallback(async () => {
        setCargando(true)
        setError(null)
        try {
            const data = await obtenerCatalogoPublico()
            setGatos(data)
        } catch (err: any) {
            setError(err.message || 'No se pudo cargar el catálogo de gatos.')
        } finally {
            setCargando(false)
        }
    }, [])

    useEffect(() => {
        cargarGatos()
    }, [cargarGatos])

    function handleAdoptar(codigo: string) {
        alert(`¡Gracias por tu interés en adoptar a (${codigo})! Por favor visítanos en Teo Cat Café o comunícate con la administración.`)
    }

    const gatosFiltrados = gatos.filter((g) =>
        (g.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
        (g.temperamento || '').toLowerCase().includes(busqueda.toLowerCase())
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

            {/* Mensaje de Error */}
            {error && (
                <div className="mb-6 flex items-center justify-between rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
                    <div className="flex items-center gap-2">
                        <span>⚠️</span>
                        <span>{error}</span>
                    </div>
                    <button
                        onClick={cargarGatos}
                        className="rounded-lg bg-red-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-900 transition"
                    >
                        Reintentar
                    </button>
                </div>
            )}

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
                            peso={gato.peso || 0}
                            talla={gato.talla || undefined}
                            edadMeses={gato.edadMeses}
                            temperamento={gato.temperamento || undefined}
                            colorPelaje={gato.colorPelaje || undefined}
                            sexo={gato.sexo as SexoGato | undefined}
                            estado={gato.estado as EstadoGato}
                            fotoUrl={gato.fotoUrl}
                            historia={gato.historia || undefined}
                            modoPublico={true}
                            onAdoptar={handleAdoptar}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
