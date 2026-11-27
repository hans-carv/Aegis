import { useEffect, useMemo, useState } from 'react'
import { Award, FileCheck2, Search } from 'lucide-react'
import TarjetaPropietarioLegal from '../../components/TarjetaPropietarioLegal'
import { listarAdopcionesFormales } from '../../services/adopcionesService'
import type { AdopcionFormalItem } from '../../types/adopcion'

export default function DirectorioAdoptantes() {
    const [adopciones, setAdopciones] = useState<AdopcionFormalItem[]>([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [busqueda, setBusqueda] = useState('')
    const [filtroContrato, setFiltroContrato] = useState<'TODOS' | 'FIRMADOS' | 'PENDIENTES'>('TODOS')

    function cargarAdopciones() {
        setCargando(true)
        listarAdopcionesFormales()
            .then((data) => {
                setAdopciones(data)
                setError(null)
            })
            .catch((err) =>
                setError(
                    err instanceof Error
                        ? err.message
                        : 'Error al consultar el directorio de adoptantes.'
                )
            )
            .finally(() => setCargando(false))
    }

    useEffect(() => {
        cargarAdopciones()
    }, [])

    const adopcionesFiltradas = useMemo(() => {
        const term = busqueda.trim().toLowerCase()
        return adopciones.filter((item) => {
            const coincideTexto =
                !term ||
                item.nombreCompleto.toLowerCase().includes(term) ||
                item.email.toLowerCase().includes(term) ||
                item.gatoNombre.toLowerCase().includes(term) ||
                item.codigoFelino.toLowerCase().includes(term)

            const estaFirmado = Boolean(item.contratoFirmadoUrl)
            const coincideContrato =
                filtroContrato === 'TODOS' ||
                (filtroContrato === 'FIRMADOS' && estaFirmado) ||
                (filtroContrato === 'PENDIENTES' && !estaFirmado)

            return coincideTexto && coincideContrato
        })
    }, [adopciones, busqueda, filtroContrato])

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-heading text-2xl font-bold tracking-tight text-marino sm:text-3xl">
                        Directorio de Adoptantes y Contratos
                    </h1>
                    <p className="mt-1 text-sm text-marino/75">
                        Registro histórico de tenencia legal responsable, emisión de contratos PDF y
                        resguardo de copias firmadas.
                    </p>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-xs font-bold text-emerald-800 ring-1 ring-emerald-200 self-start">
                    <FileCheck2 className="h-4 w-4 text-emerald-700" />
                    <span>{adopciones.length} adopciones formalizadas</span>
                </div>
            </header>

            {/* Barra de búsqueda y filtro */}
            <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1">
                    <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-marino/45" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por adoptante, correo, nombre de felino o código..."
                        className="h-10 w-full rounded-xl border border-beige bg-white pr-4 pl-10 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                    />
                </div>

                <div className="flex items-center gap-1.5 rounded-xl bg-crema p-1 ring-1 ring-beige/70">
                    {(
                        [
                            { id: 'TODOS', label: 'Todos' },
                            { id: 'PENDIENTES', label: 'Firma pendiente' },
                            { id: 'FIRMADOS', label: 'Firmados' },
                        ] as const
                    ).map((opt) => (
                        <button
                            key={opt.id}
                            type="button"
                            onClick={() => setFiltroContrato(opt.id)}
                            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                                filtroContrato === opt.id
                                    ? 'bg-marino text-crema shadow-xs'
                                    : 'text-marino/75 hover:text-marino'
                            }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {cargando ? (
                <div className="space-y-4">
                    {[1, 2].map((n) => (
                        <div
                            key={n}
                            className="h-48 animate-pulse rounded-2xl bg-white/80 ring-1 ring-beige/60"
                        />
                    ))}
                </div>
            ) : error ? (
                <div className="rounded-2xl bg-red-50 p-6 text-center ring-1 ring-red-200">
                    <p className="text-sm font-semibold text-red-700">{error}</p>
                </div>
            ) : adopcionesFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-beige bg-white/60 p-12 text-center">
                    <Award className="h-10 w-10 text-beige" />
                    <h2 className="mt-3 font-heading text-lg font-bold text-marino">
                        No hay adopciones registradas con ese filtro
                    </h2>
                    <p className="mt-1 text-sm text-marino/65">
                        Cuando confirmes una adopción definitiva desde una postulación aprobada, aparecerá
                        aquí junto con su contrato legal en PDF.
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    {adopcionesFiltradas.map((item) => (
                        <TarjetaPropietarioLegal
                            key={item.adopcionId}
                            propietario={item}
                            codigoFelino={item.codigoFelino}
                            gatoNombre={item.gatoNombre}
                            onContratoActualizado={(cambios) =>
                                setAdopciones((prev) =>
                                    prev.map((a) =>
                                        a.adopcionId === item.adopcionId ? { ...a, ...cambios } : a
                                    )
                                )
                            }
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
