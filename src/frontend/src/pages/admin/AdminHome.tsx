import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import GatoCard, { type EstadoGato, type SexoGato } from '../../components/GatoCard'
import { obtenerTodosLosGatos, type GatoCompleto } from '../../services/catsService'

export default function AdminHome() {
    const [gatos, setGatos] = useState<GatoCompleto[]>([])
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        obtenerTodosLosGatos()
            .then((data) => {
                setGatos(data)
                setCargando(false)
            })
            .catch(() => {
                setCargando(false)
            })
    }, [])

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <header>
                <h1 className="font-heading text-2xl font-semibold text-marino sm:text-3xl">
                    ¡Bienvenida a Proyecto Teo!
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-marino/70 sm:text-base">
                    Este es el espacio para coordinar el rescate y la adopción responsable de gatos:
                    registra nuevos ingresos y da seguimiento a cada felino en acogida.
                </p>
            </header>

            {/* Accesos rápidos */}
            <section aria-labelledby="accesos-rapidos-titulo">
                <h2 id="accesos-rapidos-titulo" className="font-heading text-lg font-semibold text-marino">
                    Accesos rápidos
                </h2>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Link
                        to="/admin/ingresos"
                        className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-[#D9C3A5]/70 transition hover:ring-[#A9D6E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D6E8]"
                    >
                        <p className="font-heading text-base font-semibold text-marino">Registrar ingresos</p>
                        <p className="mt-1 text-sm text-marino/65">
                            Anota la llegada de un gato rescatado o derivado.
                        </p>
                    </Link>
                    <Link
                        to="/admin/felinos"
                        className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-[#D9C3A5]/70 transition hover:ring-[#A9D6E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D6E8]"
                    >
                        <p className="font-heading text-base font-semibold text-marino">Dar de alta felinos</p>
                        <p className="mt-1 text-sm text-marino/65">
                            Completa la ficha de un gato para su seguimiento.
                        </p>
                    </Link>
                </div>
            </section>

            {/* Sección Felinos en seguimiento */}
            <section aria-labelledby="gatos-prueba-titulo">
                <div className="flex flex-wrap items-end justify-between gap-2">
                    <h2 id="gatos-prueba-titulo" className="font-heading text-lg font-semibold text-marino">
                        Felinos en seguimiento
                    </h2>
                    <p className="text-xs font-semibold tracking-wide text-cafe uppercase">
                        {cargando ? 'Cargando...' : `${gatos.length} felinos registrados`}
                    </p>
                </div>

                {cargando ? (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-80 animate-pulse rounded-2xl bg-beige/30" />
                        ))}
                    </div>
                ) : gatos.length === 0 ? (
                    <div className="mt-4 rounded-2xl border border-dashed border-beige bg-white p-8 text-center text-marino/60">
                        No hay felinos en seguimiento registrados todavía.
                    </div>
                ) : (
                    <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="list">
                        {gatos.map((gato) => {
                            const codigo = gato.codigoFelino || (gato as any).codigo_felino || 'CAT-000'
                            const edad = gato.edadMeses ?? (gato as any).edad_meses ?? 0
                            const peso = Number(gato.peso) || 0
                            const foto = gato.fotoUrl || (gato as any).foto_url || undefined

                            return (
                                <li key={gato.id || codigo}>
                                    <GatoCard
                                        codigoFelino={codigo}
                                        nombre={gato.nombre}
                                        peso={peso}
                                        talla={gato.talla || undefined}
                                        edadMeses={edad}
                                        temperamento={gato.temperamento || undefined}
                                        colorPelaje={gato.colorPelaje || (gato as any).color_pelaje || undefined}
                                        sexo={gato.sexo as SexoGato | undefined}
                                        estado={gato.estado as EstadoGato}
                                        fotoUrl={foto}
                                        historia={gato.historia || undefined}
                                        modoPublico={false}
                                    />
                                </li>
                            )
                        })}
                    </ul>
                )}
            </section>
        </div>
    )
}
