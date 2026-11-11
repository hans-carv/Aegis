import { Link } from 'react-router'
import { useEffect, useState } from 'react'
import GatoCard, { type EstadoGato, type SexoGato } from '../../components/GatoCard'
import teoFoto from '../../assets/teo.jfif'
import { useAuth } from '../../hooks/useAuth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface GatoBackend {
    id: string
    codigo_felino: string
    nombre: string
    peso: number | string
    talla?: string
    edad_meses: number
    temperamento?: string
    color_pelaje?: string
    sexo?: SexoGato
    estado: EstadoGato
    foto_url?: string
    historia?: string
    created_at: string
}

export default function AdminHome() {
    const { token } = useAuth()
    const [felinos, setFelinos] = useState<GatoBackend[]>([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchFelinos() {
            setCargando(true)
            setError(null)

            try {
                const authToken = token || localStorage.getItem('teo_auth_token')

                const response = await fetch(`${API_URL}/gatos`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
                    },
                })

                if (!response.ok) {
                    throw new Error(`Error ${response.status}: no se pudieron cargar los felinos.`)
                }

                const json = await response.json()
                setFelinos(json.data || [])
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al conectar con el servidor')
            } finally {
                setCargando(false)
            }
        }

        fetchFelinos()
    }, [token])

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <header className="flex flex-col gap-1">
                <h1 className="font-heading text-2xl font-bold tracking-tight text-marino sm:text-3xl">
                    Panel de administración
                </h1>
                <p className="font-sans text-sm text-marino/75">
                    Accesos rápidos a la gestión de felinos del café.
                </p>
            </header>

            {/* Accesos rápidos */}
            <section aria-labelledby="accesos-rapidos-titulo" className="grid gap-4 sm:grid-cols-2">
                <h2 id="accesos-rapidos-titulo" className="sr-only">
                    Módulos principales
                </h2>

                <div className="flex flex-col justify-between rounded-2xl border border-beige/80 bg-white p-6 shadow-sm">
                    <div className="space-y-2">
                        <span className="inline-block rounded-lg bg-celeste/40 px-2.5 py-1 text-xs font-semibold text-marino">
                            Módulo de ingresos
                        </span>
                        <h3 className="font-heading text-xl font-bold text-marino">
                            Ingresos de gatos
                        </h3>
                        <p className="text-sm leading-relaxed text-marino/75">
                            Registra el origen del felino (rescatado, fundación o particular) y los datos asociados al ingreso.
                        </p>
                    </div>
                    <div className="mt-6">
                        <Link
                            to="/admin/ingresos"
                            className="inline-flex w-full items-center justify-center rounded-xl bg-marino px-4 py-3 text-sm font-semibold text-crema shadow-sm transition hover:bg-marino/90"
                        >
                            Registrar ingreso
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col justify-between rounded-2xl border border-beige/80 bg-white p-6 shadow-sm">
                    <div className="space-y-2">
                        <span className="inline-block rounded-lg bg-celeste/40 px-2.5 py-1 text-xs font-semibold text-marino">
                            Catálogo y fichas
                        </span>
                        <h3 className="font-heading text-xl font-bold text-marino">
                            Alta de felinos
                        </h3>
                        <p className="text-sm leading-relaxed text-marino/75">
                            Formulario para dar de alta a un gato en el sistema con su ficha técnica, fotos y estado inicial.
                        </p>
                    </div>
                    <div className="mt-6">
                        <Link
                            to="/admin/felinos"
                            className="inline-flex w-full items-center justify-center rounded-xl bg-marino px-4 py-3 text-sm font-semibold text-crema shadow-sm transition hover:bg-marino/90"
                        >
                            Dar de alta felinos
                        </Link>
                    </div>
                </div>
            </section>

            {/* Sección de Felinos en Seguimiento desde el Backend */}
            <section aria-labelledby="felinos-seguimiento-titulo">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <h2 id="felinos-seguimiento-titulo" className="font-heading text-lg font-semibold text-marino">
                        Felinos en seguimiento
                    </h2>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-emerald-600/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Base de datos en vivo ({felinos.length})
                    </span>
                </div>

                {/* Estado de carga */}
                {cargando && (
                    <div className="flex h-48 w-full flex-col items-center justify-center gap-3">
                        <div className="h-8 w-8 animate-spin rounded-full border-3 border-celeste border-t-marino" />
                        <p className="font-sans text-sm text-marino/70">Consultando felinos en la base de datos...</p>
                    </div>
                )}

                {/* Error de conexión */}
                {!cargando && error && (
                    <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
                        <p className="font-sans text-sm font-medium text-red-600">{error}</p>
                        <p className="mt-1 text-xs text-red-400">Verifica que el backend esté encendido en el puerto 3000.</p>
                    </div>
                )}

                {/* Lista vacía */}
                {!cargando && !error && felinos.length === 0 && (
                    <div className="mt-4 rounded-2xl border border-dashed border-[#D9C3A5] bg-white/50 p-10 text-center">
                        <p className="font-heading text-base font-semibold text-marino">No hay felinos registrados aún</p>
                        <p className="mt-1 text-sm text-marino/60">Haz clic en &ldquo;Dar de alta felinos&rdquo; para registrar el primero.</p>
                    </div>
                )}

                {/* Cuadrícula de tarjetas con datos reales */}
                {!cargando && !error && felinos.length > 0 && (
                    <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="list">
                        {felinos.map((gato) => (
                            <li key={gato.id || gato.codigo_felino}>
                                <GatoCard
                                    codigoFelino={gato.codigo_felino}
                                    nombre={gato.nombre}
                                    peso={Number(gato.peso)}
                                    talla={gato.talla}
                                    edadMeses={gato.edad_meses}
                                    temperamento={gato.temperamento || 'Sin especificar'}
                                    colorPelaje={gato.color_pelaje}
                                    sexo={gato.sexo}
                                    estado={gato.estado}
                                    fotoUrl={gato.foto_url || teoFoto}
                                    historia={gato.historia}
                                    modoPublico={false}
                                />
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    )
}
