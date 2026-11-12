import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import {
    AlertCircle, Ban, Calendar as CalendarIcon, CheckCircle2, 
    ChevronLeft, ChevronRight, Clock, Lock, Sparkles, Users,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { consultarDisponibilidad, crearReserva, ReservaApiError } from '../../services/reservasService'
import type { DisponibilidadFranja, ReservaUsuario } from '../../types/reserva'

const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]
const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function formatearFechaISO(date: Date): string {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
}

function formatearFechaLegible(fechaISO: string): string {
    const [y, m, d] = fechaISO.split('-').map(Number)
    const fecha = new Date(y, m - 1, d)
    return fecha.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })
}

export default function ReservarVisita() {
    const { estaAutenticado } = useAuth()
    const navigate = useNavigate()

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const hoyISO = formatearFechaISO(hoy)

    // Mes visible en el calendario
    const [mesActual, setMesActual] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1))
    const [fechaSeleccionada, setFechaSeleccionada] = useState<string | null>(null)

    // Turnos y selección
    const [turnos, setTurnos] = useState<DisponibilidadFranja[]>([])
    const [cargandoTurnos, setCargandoTurnos] = useState(false)
    const [turnoSeleccionado, setTurnoSeleccionado] = useState<DisponibilidadFranja | null>(null)
    const [cantidadPersonas, setCantidadPersonas] = useState(1)

    // Flujo de confirmación
    const [pasoConfirmacion, setPasoConfirmacion] = useState(false)
    const [enviandoReserva, setEnviandoReserva] = useState(false)
    const [errorReserva, setErrorReserva] = useState<string | null>(null)
    const [reservaExitosa, setReservaExitosa] = useState<{
        reserva: ReservaUsuario
        cuposRestantes: number
    } | null>(null)

    useEffect(() => {
        if (!fechaSeleccionada) return
        cargarTurnosFecha(fechaSeleccionada)
    }, [fechaSeleccionada])

    async function cargarTurnosFecha(fecha: string) {
        setCargandoTurnos(true)
        setTurnoSeleccionado(null)
        setPasoConfirmacion(false)
        setErrorReserva(null)
        setReservaExitosa(null)

        try {
            const data = await consultarDisponibilidad(fecha)
            setTurnos(data)
        } catch {
            setErrorReserva('No se pudo obtener la disponibilidad para esta fecha.')
        } finally {
            setCargandoTurnos(false)
        }
    }

    function seleccionarTurno(turno: DisponibilidadFranja) {
        if (!turno.disponible) return
        setTurnoSeleccionado(turno)
        setCantidadPersonas(1)
        setPasoConfirmacion(false)
        setErrorReserva(null)
        setReservaExitosa(null)
    }

    async function confirmarReservaFinal() {
        if (!fechaSeleccionada || !turnoSeleccionado) return

        if (!estaAutenticado) {
            navigate('/login')
            return
        }

        setEnviandoReserva(true)
        setErrorReserva(null)

        try {
            const resultado = await crearReserva({
                franjaId: turnoSeleccionado.franjaId,
                fechaReserva: fechaSeleccionada,
                cantidadPersonas,
            })

            setReservaExitosa(resultado)
            setPasoConfirmacion(false)

            // Actualizar disponibilidad en la lista local
            const actualizados = await consultarDisponibilidad(fechaSeleccionada)
            setTurnos(actualizados)
            setTurnoSeleccionado(null)
        } catch (err) {
            if (err instanceof ReservaApiError && err.status === 409) {
                setErrorReserva(err.message)
                // Refrescar turnos para reflejar cupos actualizados
                const actualizados = await consultarDisponibilidad(fechaSeleccionada)
                setTurnos(actualizados)
                setTurnoSeleccionado(null)
                setPasoConfirmacion(false)
            } else {
                setErrorReserva(
                    err instanceof Error ? err.message : 'No se pudo completar la reserva.'
                )
            }
        } finally {
            setEnviandoReserva(false)
        }
    }

    // Construcción de días del mes 
    const anio = mesActual.getFullYear()
    const mes = mesActual.getMonth()
    const primerDiaMes = new Date(anio, mes, 1).getDay()
    const offsetLunes = primerDiaMes === 0 ? 6 : primerDiaMes - 1
    const diasEnMes = new Date(anio, mes + 1, 0).getDate()

    const puedeRetrocederMes =
        anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes > hoy.getMonth())

    return (
        <div className="flex flex-col pb-16">
            {/* Hero Banner */}
            <section className="bg-marino py-12 text-crema sm:py-16">
                <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 md:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-celeste ring-1 ring-white/15">
                        <Sparkles className="h-3.5 w-3.5" />
                        Reserva tu visita
                    </span>
                    <h1 className="mt-4 font-heading text-3xl font-bold tracking-tight sm:text-5xl">
                        Ven a conocer a los gatitos
                    </h1>
                    <p className="mx-auto mt-3 max-w-2xl text-sm text-beige sm:text-base">
                        Elige una fecha y un turno disponible para disfrutar de un tiempo con nuestros rescatados en Teo Cat Café. ¡Te esperamos!
                    </p>
                </div>
            </section>

            {/* Contenedor Principal: Calendario + Turnos */}
            <section className="mx-auto mt-8 w-full max-w-5xl px-4 sm:px-6 md:px-8">
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Columna Izquierda: Calendario Interactivo */}
                    <div className="rounded-3xl bg-white p-6 shadow-[0_14px_40px_rgba(23,38,65,0.07)] ring-1 ring-beige/70 lg:col-span-5 h-fit">
                        <div className="flex items-center gap-2.5 text-marino mb-5">
                            <CalendarIcon className="h-5 w-5 text-cafe" />
                            <h2 className="font-heading text-lg font-bold">Selecciona una fecha</h2>
                        </div>

                        {/* Navegación del Mes */}
                        <div className="mb-4 flex items-center justify-between">
                            <button
                                type="button"
                                disabled={!puedeRetrocederMes}
                                onClick={() => setMesActual(new Date(anio, mes - 1, 1))}
                                aria-label="Mes anterior"
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-marino transition hover:bg-crema disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
                            >
                                <ChevronLeft className="h-5 w-5" />
                            </button>

                            <p className="font-heading text-base font-bold text-marino">
                                {MESES[mes]} {anio}
                            </p>

                            <button
                                type="button"
                                onClick={() => setMesActual(new Date(anio, mes + 1, 1))}
                                aria-label="Mes siguiente"
                                className="flex h-9 w-9 items-center justify-center rounded-xl text-marino transition hover:bg-crema cursor-pointer"
                            >
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Encabezados Días */}
                        <div className="grid grid-cols-7 text-center text-xs font-semibold text-marino/50 mb-2">
                            {DIAS_CORTOS.map((d) => (
                                <div key={d} className="py-1">
                                    {d}
                                </div>
                            ))}
                        </div>

                        {/* Grilla de Días */}
                        <div className="grid grid-cols-7 gap-1 text-center">
                            {Array.from({ length: offsetLunes }).map((_, i) => (
                                <div key={`empty-${i}`} />
                            ))}

                            {Array.from({ length: diasEnMes }).map((_, index) => {
                                const diaNum = index + 1
                                const fechaObj = new Date(anio, mes, diaNum)
                                const fechaISO = formatearFechaISO(fechaObj)
                                const esPasado = fechaObj < hoy
                                const esHoy = fechaISO === hoyISO
                                const estaSeleccionado = fechaISO === fechaSeleccionada

                                return (
                                    <button
                                        key={fechaISO}
                                        type="button"
                                        disabled={esPasado}
                                        onClick={() => setFechaSeleccionada(fechaISO)}
                                        className={`relative flex h-10 w-full items-center justify-center rounded-xl text-sm font-semibold transition ${esPasado
                                                ? 'text-marino/25 cursor-not-allowed'
                                                : estaSeleccionado
                                                    ? 'bg-marino text-crema shadow-sm cursor-pointer'
                                                    : esHoy
                                                        ? 'ring-2 ring-celeste text-marino hover:bg-crema cursor-pointer'
                                                        : 'text-marino hover:bg-crema cursor-pointer'
                                            }`}
                                    >
                                        {diaNum}
                                        {esHoy && !estaSeleccionado && (
                                            <span className="absolute bottom-1 h-1 w-1 rounded-full bg-cafe" />
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Columna Derecha: Turnos y Confirmación */}
                    <div className="rounded-3xl bg-white p-6 shadow-[0_14px_40px_rgba(23,38,65,0.07)] ring-1 ring-beige/70 lg:col-span-7 flex flex-col justify-between min-h-96">
                        {!fechaSeleccionada ? (
                            /* Estado Inicial sin fecha */
                            <div className="flex flex-1 flex-col items-center justify-center py-12 text-center">
                                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-crema text-beige ring-1 ring-beige/70">
                                    <CalendarIcon className="h-8 w-8" />
                                </div>
                                <h3 className="mt-4 font-heading text-lg font-bold text-marino">
                                    Selecciona una fecha
                                </h3>
                                <p className="mt-1 max-w-xs text-sm text-marino/65">
                                    Elige un día en el calendario para ver los turnos disponibles en la sala de gatos.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Cabecera de la fecha elegida */}
                                <div className="border-b border-beige/50 pb-4">
                                    <p className="text-xs font-bold uppercase tracking-wider text-cafe">
                                        Turnos para el
                                    </p>
                                    <h2 className="mt-0.5 font-heading text-xl font-bold capitalize text-marino">
                                        {formatearFechaLegible(fechaSeleccionada)}
                                    </h2>
                                </div>

                                {/* Error de Reserva / Disponibilidad */}
                                {errorReserva && (
                                    <div
                                        role="alert"
                                        className="flex items-start gap-2.5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-900 ring-1 ring-red-200"
                                    >
                                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                                        <span>{errorReserva}</span>
                                    </div>
                                )}

                                {/* Pantalla / Mensaje de Reserva Exitosa */}
                                {reservaExitosa && (
                                    <div className="rounded-2xl bg-green-50 p-5 ring-1 ring-green-600/30 space-y-3">
                                        <div className="flex items-center gap-3 text-green-900">
                                            <CheckCircle2 className="h-6 w-6 shrink-0 text-green-700" />
                                            <h3 className="font-heading text-lg font-bold">
                                                ¡Reserva confirmada con éxito!
                                            </h3>
                                        </div>
                                        <p className="text-sm text-green-800">
                                            Te esperamos el <strong>{formatearFechaLegible(reservaExitosa.reserva.fechaReserva)}</strong> de{' '}
                                            <strong>{reservaExitosa.reserva.horaInicio} a {reservaExitosa.reserva.horaFin}</strong> para{' '}
                                            <strong>{reservaExitosa.reserva.cantidadPersonas} {reservaExitosa.reserva.cantidadPersonas === 1 ? 'persona' : 'personas'}</strong>.
                                        </p>
                                        <p className="text-xs font-semibold text-green-800/80">
                                            Cupos restantes en este horario: {reservaExitosa.cuposRestantes}
                                        </p>
                                        <div className="pt-2 flex flex-wrap gap-3">
                                            <Link
                                                to="/perfil"
                                                className="inline-flex items-center gap-2 rounded-xl bg-marino px-4 py-2 text-xs font-semibold text-crema hover:bg-marino/90"
                                            >
                                                Ver mis reservas
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* Listado de Turnos */}
                                {cargandoTurnos ? (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="h-24 animate-pulse rounded-2xl bg-crema" />
                                        ))}
                                    </div>
                                ) : turnos.length === 0 ? (
                                    <div className="rounded-2xl bg-crema/70 p-8 text-center ring-1 ring-beige/60">
                                        <p className="font-heading text-base font-bold text-marino">
                                            No hay turnos programados para este día
                                        </p>
                                        <p className="mt-1 text-xs text-marino/70">
                                            Por favor selecciona otra fecha en el calendario.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        {turnos.map((turno) => {
                                            const esBloqueado = !turno.activo
                                            const esAgotado = turno.activo && turno.cuposDisponibles <= 0
                                            const seleccionado = turnoSeleccionado?.franjaId === turno.franjaId

                                            return (
                                                <button
                                                    key={turno.franjaId}
                                                    type="button"
                                                    disabled={!turno.disponible}
                                                    onClick={() => seleccionarTurno(turno)}
                                                    className={`flex flex-col justify-between rounded-2xl border p-4 text-left transition ${!turno.disponible
                                                            ? 'border-beige/60 bg-crema/40 opacity-65 cursor-not-allowed'
                                                            : seleccionado
                                                                ? 'border-marino bg-celeste/25 ring-2 ring-marino cursor-pointer'
                                                                : 'border-beige bg-white hover:border-marino/50 hover:bg-crema/40 cursor-pointer'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="inline-flex items-center gap-1.5 font-heading text-base font-bold text-marino">
                                                            <Clock className="h-4 w-4 text-cafe" />
                                                            {turno.horaInicio} – {turno.horaFin}
                                                        </span>

                                                        {esBloqueado ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-cafe">
                                                                <Lock className="h-3 w-3" />
                                                                Bloqueado
                                                            </span>
                                                        ) : esAgotado ? (
                                                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">
                                                                <Ban className="h-3 w-3" />
                                                                Agotado
                                                            </span>
                                                        ) : (
                                                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-semibold text-green-800">
                                                                Disponible
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-3 text-xs text-marino/75">
                                                        {esBloqueado ? (
                                                            <p className="text-cafe font-medium">
                                                                {turno.motivoBloqueo || 'Turno no disponible temporalmente'}
                                                            </p>
                                                        ) : (
                                                            <p className="flex items-center gap-1.5">
                                                                <Users className="h-3.5 w-3.5 text-marino/60" />
                                                                <span>
                                                                    <strong>{turno.cuposDisponibles}</strong> de {turno.aforoMaximo} cupos disponibles
                                                                </span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </button>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Panel de Selección de Personas y Resumen de Confirmación */}
                                {turnoSeleccionado && (
                                    <div className="rounded-2xl bg-crema/80 p-5 ring-1 ring-beige space-y-4">
                                        {!pasoConfirmacion ? (
                                            <>
                                                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                                    <div>
                                                        <label
                                                            htmlFor="cantidadPersonas"
                                                            className="block text-sm font-bold text-marino"
                                                        >
                                                            Cantidad de personas
                                                        </label>
                                                        <p className="text-xs text-marino/70">
                                                            Máximo {turnoSeleccionado.cuposDisponibles} cupos en este turno
                                                        </p>
                                                    </div>

                                                    <select
                                                        id="cantidadPersonas"
                                                        value={cantidadPersonas}
                                                        onChange={(e) => setCantidadPersonas(Number(e.target.value))}
                                                        className="h-11 rounded-xl border border-beige bg-white px-4 text-sm font-bold text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                                                    >
                                                        {Array.from({ length: turnoSeleccionado.cuposDisponibles }).map(
                                                            (_, i) => (
                                                                <option key={i + 1} value={i + 1}>
                                                                    {i + 1} {i + 1 === 1 ? 'persona' : 'personas'}
                                                                </option>
                                                            )
                                                        )}
                                                    </select>
                                                </div>

                                                {!estaAutenticado ? (
                                                    <div className="flex flex-col items-start justify-between gap-3 rounded-xl bg-white p-4 ring-1 ring-beige sm:flex-row sm:items-center">
                                                        <p className="text-xs font-medium text-marino/80">
                                                            Para reservar un turno debes iniciar sesión con tu cuenta.
                                                        </p>
                                                        <Link
                                                            to="/login"
                                                            className="shrink-0 rounded-xl bg-marino px-4 py-2 text-xs font-semibold text-crema hover:bg-marino/90"
                                                        >
                                                            Iniciar sesión
                                                        </Link>
                                                    </div>
                                                ) : (
                                                    <div className="flex justify-end">
                                                        <button
                                                            type="button"
                                                            onClick={() => setPasoConfirmacion(true)}
                                                            className="w-full rounded-xl bg-marino px-6 py-3 text-sm font-semibold text-crema transition hover:bg-marino/90 sm:w-auto cursor-pointer"
                                                        >
                                                            Continuar con la reserva
                                                        </button>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            /* Resumen previo a confirmar */
                                            <div className="space-y-4">
                                                <h3 className="font-heading text-base font-bold text-marino">
                                                    Resumen de tu reserva
                                                </h3>
                                                <dl className="grid grid-cols-1 gap-2 rounded-xl bg-white p-4 text-sm ring-1 ring-beige/70 sm:grid-cols-3">
                                                    <div>
                                                        <dt className="text-xs text-cafe font-semibold">Fecha</dt>
                                                        <dd className="font-bold text-marino">{fechaSeleccionada}</dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs text-cafe font-semibold">Horario</dt>
                                                        <dd className="font-bold text-marino">
                                                            {turnoSeleccionado.horaInicio} – {turnoSeleccionado.horaFin}
                                                        </dd>
                                                    </div>
                                                    <div>
                                                        <dt className="text-xs text-cafe font-semibold">Visitantes</dt>
                                                        <dd className="font-bold text-marino">
                                                            {cantidadPersonas} {cantidadPersonas === 1 ? 'persona' : 'personas'}
                                                        </dd>
                                                    </div>
                                                </dl>

                                                <div className="flex flex-wrap justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        disabled={enviandoReserva}
                                                        onClick={() => setPasoConfirmacion(false)}
                                                        className="rounded-xl px-4 py-2.5 text-sm font-semibold text-marino/75 hover:bg-white cursor-pointer"
                                                    >
                                                        Modificar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={enviandoReserva}
                                                        onClick={confirmarReservaFinal}
                                                        className="rounded-xl bg-marino px-6 py-2.5 text-sm font-semibold text-crema transition hover:bg-marino/90 disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {enviandoReserva ? 'Confirmando...' : 'Confirmar reserva'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </div>
    )
}