import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import {
    Calendar, CalendarPlus, Clock, Heart,
    LogOut, Mail, ShieldCheck, Users,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { listarMisReservas } from '../../services/reservasService'
import type { EstadoReserva, ReservaUsuario } from '../../types/reserva'

type TabActiva = 'reservas' | 'postulaciones'

const ESTILO_ESTADO: Record<EstadoReserva, { etiqueta: string; clases: string }> = {
    CONFIRMADA: {
        etiqueta: 'Confirmada',
        clases: 'bg-green-100 text-green-800 ring-green-300',
    },
    COMPLETADA: {
        etiqueta: 'Completada',
        clases: 'bg-celeste/40 text-marino ring-celeste',
    },
    CANCELADA: {
        etiqueta: 'Cancelada',
        clases: 'bg-red-100 text-red-800 ring-red-200',
    },
    NO_ASISTIO: {
        etiqueta: 'No asistió',
        clases: 'bg-amber-100 text-cafe ring-beige',
    },
}

function formatearFecha(fechaISO: string) {
    const [y, m, d] = fechaISO.split('-').map(Number)
    return new Date(y, m - 1, d).toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

export default function MiPerfil() {
    const { usuario, logout } = useAuth()
    const navigate = useNavigate()

    const [tabActiva, setTabActiva] = useState<TabActiva>('reservas')
    const [reservas, setReservas] = useState<ReservaUsuario[]>([])
    const [cargandoReservas, setCargandoReservas] = useState(true)

    useEffect(() => {
        listarMisReservas()
            .then(setReservas)
            .finally(() => setCargandoReservas(false))
    }, [])

    function handleLogout() {
        logout()
        navigate('/')
    }

    const inicialUsuario = usuario?.nombre?.charAt(0).toUpperCase() || 'U'

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 md:px-8 space-y-8">
            {/* Cabecera de Perfil del Usuario */}
            <section
                aria-labelledby="perfil-usuario-titulo"
                className="flex flex-col justify-between gap-6 rounded-3xl bg-white p-6 shadow-[0_12px_35px_rgba(23,38,65,0.06)] ring-1 ring-beige/70 sm:flex-row sm:items-center sm:p-8"
            >
                <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-marino font-heading text-3xl font-bold text-crema shadow-md ring-4 ring-celeste/50">
                        {inicialUsuario}
                    </div>

                    <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                            <h1 id="perfil-usuario-titulo" className="font-heading text-2xl font-bold text-marino">
                                {usuario?.nombre || 'Visitante'}
                            </h1>
                            <span className="inline-flex items-center gap-1 rounded-full bg-celeste/35 px-2.5 py-0.5 text-xs font-semibold text-marino">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                {usuario?.rol === 'ADMIN' ? 'Administración' : 'Cuenta verificada'}
                            </span>
                        </div>

                        <p className="inline-flex items-center gap-1.5 text-sm text-marino/70">
                            <Mail className="h-4 w-4 text-cafe" />
                            {usuario?.email || 'correo@ejemplo.com'}
                        </p>
                    </div>
                </div>

                <div className="flex justify-center sm:justify-end">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/70 px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-100 cursor-pointer"
                    >
                        <LogOut className="h-4 w-4" />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </section>

            {/* Navegación por Pestañas (Tabs de Actividades) */}
            <section className="space-y-6">
                <div
                    role="tablist"
                    aria-label="Actividades del usuario"
                    className="flex gap-2 border-b border-beige/70 pb-px overflow-x-auto"
                >
                    <button
                        type="button"
                        role="tab"
                        aria-selected={tabActiva === 'reservas'}
                        onClick={() => setTabActiva('reservas')}
                        className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition cursor-pointer ${tabActiva === 'reservas'
                                ? 'border-marino text-marino'
                                : 'border-transparent text-marino/60 hover:text-marino'
                            }`}
                    >
                        <Calendar className="h-4 w-4" />
                        <span>Mis reservas</span>
                        <span className="rounded-full bg-crema px-2 py-0.5 text-xs font-bold text-cafe ring-1 ring-beige">
                            {reservas.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        role="tab"
                        aria-selected={tabActiva === 'postulaciones'}
                        onClick={() => setTabActiva('postulaciones')}
                        className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold whitespace-nowrap transition cursor-pointer ${tabActiva === 'postulaciones'
                                ? 'border-marino text-marino'
                                : 'border-transparent text-marino/60 hover:text-marino'
                            }`}
                    >
                        <Heart className="h-4 w-4" />
                        <span>Mis postulaciones</span>
                    </button>
                </div>

                {/* Contenido Tab 1: Mis Reservas */}
                {tabActiva === 'reservas' && (
                    <div role="tabpanel" className="space-y-5">
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <div>
                                <h2 className="font-heading text-xl font-bold text-marino">
                                    Visitas a la sala de gatos
                                </h2>
                                <p className="text-sm text-marino/70">
                                    Historial y estado de tus turnos agendados en Teo Cat Café.
                                </p>
                            </div>

                            <Link
                                to="/visita"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-marino px-4 py-2.5 text-sm font-semibold text-crema transition hover:bg-marino/90"
                            >
                                <CalendarPlus className="h-4 w-4" />
                                <span>Agendar visita</span>
                            </Link>
                        </div>

                        {cargandoReservas ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {[1, 2].map((n) => (
                                    <div
                                        key={n}
                                        className="h-28 animate-pulse rounded-2xl bg-white/80 ring-1 ring-beige/60"
                                    />
                                ))}
                            </div>
                        ) : reservas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-beige bg-white p-12 text-center">
                                <Calendar className="h-12 w-12 text-beige" />
                                <h3 className="mt-4 font-heading text-lg font-bold text-marino">
                                    Aún no tienes reservas registradas
                                </h3>
                                <p className="mt-1 max-w-md text-sm text-marino/70">
                                    Reserva un turno para interactuar con nuestros gatitos rescatados.
                                </p>
                                <Link
                                    to="/visita"
                                    className="mt-6 inline-flex items-center gap-2 rounded-xl bg-marino px-5 py-2.5 text-sm font-semibold text-crema hover:bg-marino/90"
                                >
                                    Ver horarios disponibles
                                </Link>
                            </div>
                        ) : (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {reservas.map((reserva) => {
                                    const badge = ESTILO_ESTADO[reserva.estado] || ESTILO_ESTADO.CONFIRMADA

                                    return (
                                        <article
                                            key={reserva.id}
                                            className="flex flex-col justify-between rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70"
                                        >
                                            <div>
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 text-marino">
                                                        <Calendar className="h-4 w-4 shrink-0 text-cafe" />
                                                        <h3 className="font-heading text-base font-bold capitalize">
                                                            {formatearFecha(reserva.fechaReserva)}
                                                        </h3>
                                                    </div>

                                                    <span
                                                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.clases}`}
                                                    >
                                                        {badge.etiqueta}
                                                    </span>
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-4 text-sm text-marino/80">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Clock className="h-4 w-4 text-marino/60" />
                                                        {reserva.horaInicio} – {reserva.horaFin}
                                                    </span>

                                                    <span className="inline-flex items-center gap-1.5">
                                                        <Users className="h-4 w-4 text-marino/60" />
                                                        {reserva.cantidadPersonas}{' '}
                                                        {reserva.cantidadPersonas === 1 ? 'persona' : 'personas'}
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Contenido Tab 2: Mis Postulaciones (Preparado para el futuro) */}
                {tabActiva === 'postulaciones' && (
                    <div
                        role="tabpanel"
                        className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-beige bg-white p-12 text-center"
                    >
                        <Heart className="h-12 w-12 text-beige" />
                        <h2 className="mt-4 font-heading text-lg font-bold text-marino">
                            Aún no tienes solicitudes de adopción
                        </h2>
                        <p className="mt-1 max-w-md text-sm text-marino/70">
                            Cuando te postules para adoptar a uno de nuestros gatitos, podrás hacer seguimiento de tu proceso aquí.
                        </p>
                        <Link
                            to="/catalogo"
                            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-marino px-5 py-2.5 text-sm font-semibold text-crema hover:bg-marino/90"
                        >
                            Conocer gatitos en adopción
                        </Link>
                    </div>
                )}
            </section>
        </div>
    )
}