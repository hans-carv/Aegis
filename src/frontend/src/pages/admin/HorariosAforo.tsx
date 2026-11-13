import { useEffect, useState, type SubmitEvent } from 'react'
import {
    AlertCircle, Ban, CalendarClock, CheckCircle2, Clock,
    Edit3, Lock, Plus, Unlock, Users, X,
} from 'lucide-react'
import { actualizarFranja, crearFranja, listarFranjas } from '../../services/horariosService'
import type { DiaSemana, FranjaHoraria, FranjaHorariaPayload } from '../../types/horario'

const DIAS_SEMANA: { valor: DiaSemana; etiqueta: string }[] = [
    { valor: 'LUNES', etiqueta: 'Lunes' },
    { valor: 'MARTES', etiqueta: 'Martes' },
    { valor: 'MIERCOLES', etiqueta: 'Miércoles' },
    { valor: 'JUEVES', etiqueta: 'Jueves' },
    { valor: 'VIERNES', etiqueta: 'Viernes' },
    { valor: 'SABADO', etiqueta: 'Sábado' },
    { valor: 'DOMINGO', etiqueta: 'Domingo' },
]

// Genera opciones cada 30 minutos desde 08:00 hasta 21:00
const OPCIONES_HORAS: string[] = []
for (let h = 8; h <= 21; h++) {
    const horaStr = String(h).padStart(2, '0')
    OPCIONES_HORAS.push(`${horaStr}:00`)
    if (h < 21) OPCIONES_HORAS.push(`${horaStr}:30`)
}

function aMinutos(hora: string): number {
    const [h, m] = hora.split(':').map(Number)
    return h * 60 + m
}

export default function HorariosAforo() {
    const [franjas, setFranjas] = useState<FranjaHoraria[]>([])
    const [cargando, setCargando] = useState(true)
    const [notificacion, setNotificacion] = useState<{ tipo: 'exito' | 'error'; mensaje: string } | null>(null)

    // Estado del Modal
    const [modalAbierto, setModalAbierto] = useState(false)
    const [editandoId, setEditandoId] = useState<string | null>(null)
    const [guardando, setGuardando] = useState(false)
    const [errorModal, setErrorModal] = useState<string | null>(null)

    // Campos del formulario
    const [diaSemana, setDiaSemana] = useState<DiaSemana>('LUNES')
    const [horaInicio, setHoraInicio] = useState('10:00')
    const [horaFin, setHoraFin] = useState('12:00')
    const [aforoMaximo, setAforoMaximo] = useState('10')
    const [activo, setActivo] = useState(true)
    const [motivoBloqueo, setMotivoBloqueo] = useState('')

    async function cargarDatos() {
        setCargando(true)
        try {
            const data = await listarFranjas()
            setFranjas(data)
        } catch {
            setNotificacion({ tipo: 'error', mensaje: 'No se pudieron cargar las franjas horarias.' })
        } finally {
            setCargando(false)
        }
    }

    useEffect(() => {
        cargarDatos()
    }, [])

    function abrirModalCrear(diaPorDefecto: DiaSemana = 'LUNES') {
        setEditandoId(null)
        setDiaSemana(diaPorDefecto)
        setHoraInicio('10:00')
        setHoraFin('12:00')
        setAforoMaximo('10')
        setActivo(true)
        setMotivoBloqueo('')
        setErrorModal(null)
        setModalAbierto(true)
    }

    function abrirModalEditar(franja: FranjaHoraria) {
        setEditandoId(franja.id)
        setDiaSemana(franja.diaSemana)
        setHoraInicio(franja.horaInicio)
        setHoraFin(franja.horaFin)
        setAforoMaximo(String(franja.aforoMaximo))
        setActivo(franja.activo)
        setMotivoBloqueo(franja.motivoBloqueo || '')
        setErrorModal(null)
        setModalAbierto(true)
    }

    function validarFormulario(): string | null {
        const aforo = Number(aforoMaximo)
        if (!aforoMaximo || isNaN(aforo) || aforo <= 0 || !Number.isInteger(aforo)) {
            return 'El aforo máximo debe ser un número entero mayor a 0.'
        }

        const minInicio = aMinutos(horaInicio)
        const minFin = aMinutos(horaFin)

        if (minInicio >= minFin) {
            return 'La hora de inicio debe ser anterior a la hora de finalización.'
        }

        // Validar solapamiento solo si la franja que se guarda estará activa
        if (activo) {
            const haySolapamiento = franjas.some((f) => {
                if (f.id === editandoId) return false
                if (f.diaSemana !== diaSemana || !f.activo) return false

                const fInicio = aMinutos(f.horaInicio)
                const fFin = aMinutos(f.horaFin)
                return minInicio < fFin && minFin > fInicio
            })

            if (haySolapamiento) {
                return `El horario ${horaInicio} - ${horaFin} se solapa con otra franja activa del día ${diaSemana.toLowerCase()}.`
            }
        }

        return null
    }

    async function manejarGuardar(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        setErrorModal(null)

        const errorValidacion = validarFormulario()
        if (errorValidacion) {
            setErrorModal(errorValidacion)
            return
        }

        const payload: FranjaHorariaPayload = {
            diaSemana,
            horaInicio,
            horaFin,
            aforoMaximo: Number(aforoMaximo),
            activo,
            ...(!activo && motivoBloqueo.trim() ? { motivoBloqueo: motivoBloqueo.trim() } : {}),
        }

        setGuardando(true)
        try {
            if (editandoId) {
                const actualizada = await actualizarFranja(editandoId, payload)
                setFranjas((prev) => prev.map((f) => (f.id === editandoId ? actualizada : f)))
                setNotificacion({ tipo: 'exito', mensaje: 'Franja horaria actualizada correctamente.' })
            } else {
                const creada = await crearFranja(payload)
                setFranjas((prev) => [...prev, creada])
                setNotificacion({ tipo: 'exito', mensaje: 'Nueva franja horaria creada correctamente.' })
            }
            setModalAbierto(false)
        } catch {
            setErrorModal('Ocurrió un error al guardar la franja horaria.')
        } finally {
            setGuardando(false)
        }
    }

    async function alternarEstadoFranja(franja: FranjaHoraria) {
        const nuevoEstado = !franja.activo

        // Si se va a habilitar, comprobar que no choque con otra ya activa
        if (nuevoEstado) {
            const minInicio = aMinutos(franja.horaInicio)
            const minFin = aMinutos(franja.horaFin)
            const choca = franjas.some(
                (f) =>
                    f.id !== franja.id &&
                    f.diaSemana === franja.diaSemana &&
                    f.activo &&
                    minInicio < aMinutos(f.horaFin) &&
                    minFin > aMinutos(f.horaInicio)
            )
            if (choca) {
                setNotificacion({
                    tipo: 'error',
                    mensaje: `No se puede habilitar (${franja.horaInicio} - ${franja.horaFin}) porque se solapa con otro horario activo ese día.`,
                })
                return
            }
        }

        const payload: FranjaHorariaPayload = {
            diaSemana: franja.diaSemana,
            horaInicio: franja.horaInicio,
            horaFin: franja.horaFin,
            aforoMaximo: franja.aforoMaximo,
            activo: nuevoEstado,
            motivoBloqueo: nuevoEstado ? undefined : franja.motivoBloqueo || 'Bloqueado manualmente',
        }

        try {
            const actualizada = await actualizarFranja(franja.id, payload)
            setFranjas((prev) => prev.map((f) => (f.id === franja.id ? actualizada : f)))
            setNotificacion({
                tipo: 'exito',
                mensaje: nuevoEstado
                    ? `Horario ${franja.horaInicio} - ${franja.horaFin} habilitado.`
                    : `Horario ${franja.horaInicio} - ${franja.horaFin} bloqueado.`,
            })
        } catch {
            setNotificacion({ tipo: 'error', mensaje: 'No se pudo cambiar el estado de la franja.' })
        }
    }

    const totalFranjas = franjas.length
    const totalHabilitadas = franjas.filter((f) => f.activo).length
    const totalBloqueadas = franjas.filter((f) => !f.activo).length

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {/* Encabezado */}
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-marino text-crema shadow-sm">
                        <CalendarClock className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="font-heading text-2xl font-semibold text-marino sm:text-3xl">
                            Horarios y aforo
                        </h1>
                        <p className="mt-1 text-sm text-marino/70">
                            Configura las franjas horarias y el cupo máximo de visitantes en la sala de gatos.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => abrirModalCrear()}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-marino px-5 py-3 text-sm font-semibold text-crema shadow-sm transition hover:bg-marino/90 cursor-pointer"
                >
                    <Plus className="h-4 w-4" />
                    <span>Nueva franja</span>
                </button>
            </header>

            {/* Notificaciones */}
            {notificacion && (
                <div
                    role="alert"
                    className={`flex items-center justify-between gap-3 rounded-xl p-4 text-sm font-medium ring-1 ${notificacion.tipo === 'exito'
                            ? 'bg-green-50 text-green-900 ring-green-600/30'
                            : 'bg-red-50 text-red-900 ring-red-600/30'
                        }`}
                >
                    <div className="flex items-center gap-2.5">
                        {notificacion.tipo === 'exito' ? (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-700" />
                        ) : (
                            <AlertCircle className="h-5 w-5 shrink-0 text-red-700" />
                        )}
                        <span>{notificacion.mensaje}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNotificacion(null)}
                        aria-label="Cerrar notificación"
                        className="rounded-lg p-1 hover:bg-black/5"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            {/* Tarjetas de Resumen (KPIs) */}
            <section className="grid gap-4 sm:grid-cols-3" aria-label="Resumen de franjas">
                <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70">
                    <div>
                        <p className="text-sm font-medium text-marino/70">Total franjas</p>
                        <p className="mt-1 font-heading text-3xl font-bold text-marino">{totalFranjas}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-crema text-marino ring-1 ring-beige">
                        <Clock className="h-5 w-5" />
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70">
                    <div>
                        <p className="text-sm font-medium text-marino/70">Habilitadas</p>
                        <p className="mt-1 font-heading text-3xl font-bold text-green-700">{totalHabilitadas}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-700 ring-1 ring-green-200">
                        <CheckCircle2 className="h-5 w-5" />
                    </div>
                </div>

                <div className="flex items-center justify-between rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70">
                    <div>
                        <p className="text-sm font-medium text-marino/70">Bloqueadas</p>
                        <p className="mt-1 font-heading text-3xl font-bold text-cafe">{totalBloqueadas}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-cafe ring-1 ring-beige">
                        <Ban className="h-5 w-5" />
                    </div>
                </div>
            </section>

            {/* Contenido Principal */}
            {cargando ? (
                <div className="grid gap-4 sm:grid-cols-2">
                    {[1, 2].map((n) => (
                        <div key={n} className="h-44 animate-pulse rounded-2xl bg-white/70 ring-1 ring-beige/50" />
                    ))}
                </div>
            ) : franjas.length === 0 ? (
                /* Estado Vacío */
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-beige bg-white/60 px-6 py-16 text-center">
                    <CalendarClock className="h-12 w-12 text-beige" />
                    <h2 className="mt-4 font-heading text-lg font-bold text-marino">
                        Aún no hay franjas horarias configuradas.
                    </h2>
                    <p className="mt-1 max-w-md text-sm text-marino/65">
                        Crea la primera franja para definir los horarios y el aforo permitido en la sala de gatos.
                    </p>
                    <button
                        type="button"
                        onClick={() => abrirModalCrear()}
                        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-marino px-5 py-2.5 text-sm font-semibold text-crema transition hover:bg-marino/90 cursor-pointer"
                    >
                        <Plus className="h-4 w-4" />
                        <span>Crear primera franja</span>
                    </button>
                </div>
            ) : (
                /* Listado Agrupado por Día de la Semana */
                <div className="space-y-6">
                    {DIAS_SEMANA.map((dia) => {
                        const franjasDelDia = franjas
                            .filter((f) => f.diaSemana === dia.valor)
                            .sort((a, b) => aMinutos(a.horaInicio) - aMinutos(b.horaInicio))

                        if (franjasDelDia.length === 0) return null

                        return (
                            <section
                                key={dia.valor}
                                className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70"
                            >
                                <div className="mb-4 flex items-center justify-between border-b border-beige/40 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <h2 className="font-heading text-lg font-bold text-marino">{dia.etiqueta}</h2>
                                        <span className="rounded-full bg-crema px-2.5 py-0.5 text-xs font-semibold text-cafe ring-1 ring-beige">
                                            {franjasDelDia.length} {franjasDelDia.length === 1 ? 'turno' : 'turnos'}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => abrirModalCrear(dia.valor)}
                                        className="inline-flex items-center gap-1 text-xs font-semibold text-marino hover:text-cafe cursor-pointer"
                                    >
                                        <Plus className="h-3.5 w-3.5" />
                                        Añadir turno
                                    </button>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {franjasDelDia.map((franja) => (
                                        <article
                                            key={franja.id}
                                            className={`flex flex-col justify-between rounded-xl border p-4 transition ${franja.activo
                                                    ? 'border-beige/80 bg-crema/40'
                                                    : 'border-amber-200 bg-amber-50/50'
                                                }`}
                                        >
                                            <div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span className="inline-flex items-center gap-1.5 font-heading text-base font-bold text-marino">
                                                        <Clock className="h-4 w-4 text-cafe" />
                                                        {franja.horaInicio} – {franja.horaFin}
                                                    </span>
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${franja.activo
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-amber-200/80 text-cafe'
                                                            }`}
                                                    >
                                                        {franja.activo ? 'Habilitada' : 'Bloqueada'}
                                                    </span>
                                                </div>

                                                <div className="mt-3 flex items-center gap-2 text-sm text-marino/80">
                                                    <Users className="h-4 w-4 text-marino/60" />
                                                    <span>
                                                        Aforo máximo: <strong className="text-marino">{franja.aforoMaximo}</strong> personas
                                                    </span>
                                                </div>

                                                {!franja.activo && franja.motivoBloqueo && (
                                                    <p className="mt-2 rounded-lg bg-white/80 p-2 text-xs text-cafe ring-1 ring-beige/60">
                                                        <strong>Motivo:</strong> {franja.motivoBloqueo}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="mt-4 flex items-center justify-end gap-2 border-t border-beige/40 pt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => abrirModalEditar(franja)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-marino transition hover:bg-celeste/30 cursor-pointer"
                                                >
                                                    <Edit3 className="h-3.5 w-3.5" />
                                                    Editar
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => alternarEstadoFranja(franja)}
                                                    className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition cursor-pointer ${franja.activo
                                                            ? 'text-cafe hover:bg-amber-100'
                                                            : 'text-green-700 hover:bg-green-100'
                                                        }`}
                                                >
                                                    {franja.activo ? (
                                                        <>
                                                            <Lock className="h-3.5 w-3.5" />
                                                            Bloquear
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Unlock className="h-3.5 w-3.5" />
                                                            Habilitar
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        )
                    })}
                </div>
            )}

            {/* Modal de Creación / Edición */}
            {modalAbierto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-marino/50 p-4 backdrop-blur-xs"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="modal-franja-titulo"
                >
                    <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-beige">
                        <div className="flex items-center justify-between border-b border-beige/50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-celeste/30 text-marino">
                                    <CalendarClock className="h-5 w-5" />
                                </div>
                                <h2 id="modal-franja-titulo" className="font-heading text-xl font-bold text-marino">
                                    {editandoId ? 'Editar franja horaria' : 'Nueva franja horaria'}
                                </h2>
                            </div>
                            <button
                                type="button"
                                onClick={() => setModalAbierto(false)}
                                aria-label="Cerrar modal"
                                className="rounded-lg p-1.5 text-marino/60 hover:bg-crema hover:text-marino cursor-pointer"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={manejarGuardar} className="mt-5 space-y-4">
                            {/* Día de la semana */}
                            <div>
                                <label htmlFor="diaSemana" className="block text-sm font-semibold text-marino mb-1.5">
                                    Día de la semana <span className="text-cafe">*</span>
                                </label>
                                <select
                                    id="diaSemana"
                                    value={diaSemana}
                                    onChange={(e) => setDiaSemana(e.target.value as DiaSemana)}
                                    className="h-11 w-full rounded-xl border border-beige bg-white px-3.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                                >
                                    {DIAS_SEMANA.map((d) => (
                                        <option key={d.valor} value={d.valor}>
                                            {d.etiqueta}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Hora Inicio y Hora Fin */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="horaInicio" className="block text-sm font-semibold text-marino mb-1.5">
                                        Hora de inicio <span className="text-cafe">*</span>
                                    </label>
                                    <select
                                        id="horaInicio"
                                        value={horaInicio}
                                        onChange={(e) => setHoraInicio(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-beige bg-white px-3.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                                    >
                                        {OPCIONES_HORAS.map((h) => (
                                            <option key={h} value={h}>
                                                {h}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label htmlFor="horaFin" className="block text-sm font-semibold text-marino mb-1.5">
                                        Hora de fin <span className="text-cafe">*</span>
                                    </label>
                                    <select
                                        id="horaFin"
                                        value={horaFin}
                                        onChange={(e) => setHoraFin(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-beige bg-white px-3.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                                    >
                                        {OPCIONES_HORAS.map((h) => (
                                            <option key={h} value={h}>
                                                {h}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Aforo máximo */}
                            <div>
                                <label htmlFor="aforoMaximo" className="block text-sm font-semibold text-marino mb-1.5">
                                    Aforo máximo <span className="text-cafe">*</span>
                                </label>
                                <div className="relative">
                                    <Users className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-marino/50" />
                                    <input
                                        id="aforoMaximo"
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={aforoMaximo}
                                        onChange={(e) => setAforoMaximo(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-beige bg-white pr-4 pl-10 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                                    />
                                </div>
                            </div>

                            {/* Switch Habilitada / Bloqueada */}
                            <div className="flex items-center justify-between rounded-2xl border border-beige/80 bg-crema/50 p-3.5">
                                <div>
                                    <p className="text-sm font-semibold text-marino">
                                        {activo ? 'Franja habilitada' : 'Franja bloqueada'}
                                    </p>
                                    <p className="text-xs text-marino/70">
                                        {activo
                                            ? 'La franja estará disponible para reservas.'
                                            : 'No se permitirán reservas en este turno.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={activo}
                                    onClick={() => setActivo((prev) => !prev)}
                                    className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${activo ? 'bg-emerald-500' : 'bg-marino/30'
                                        }`}
                                >
                                    <span
                                        className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-sm transition ${activo ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Campo opcional de Motivo de bloqueo */}
                            {!activo && (
                                <div>
                                    <label htmlFor="motivoBloqueo" className="block text-sm font-semibold text-marino mb-1.5">
                                        Motivo del bloqueo <span className="text-xs font-normal text-marino/60">(opcional)</span>
                                    </label>
                                    <input
                                        id="motivoBloqueo"
                                        type="text"
                                        maxLength={150}
                                        placeholder="Ej. Mantenimiento, jornada veterinaria..."
                                        value={motivoBloqueo}
                                        onChange={(e) => setMotivoBloqueo(e.target.value)}
                                        className="h-11 w-full rounded-xl border border-beige bg-white px-3.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                                    />
                                </div>
                            )}

                            {/* Mensaje de error en el modal */}
                            {errorModal && (
                                <div role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-800 ring-1 ring-red-200">
                                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                                    <span>{errorModal}</span>
                                </div>
                            )}

                            {/* Acciones del Modal */}
                            <div className="flex items-center justify-end gap-3 border-t border-beige/50 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setModalAbierto(false)}
                                    className="rounded-xl px-4 py-2.5 text-sm font-semibold text-marino/75 hover:bg-crema hover:text-marino cursor-pointer"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="rounded-xl bg-marino px-5 py-2.5 text-sm font-semibold text-crema transition hover:bg-marino/90 disabled:opacity-70 cursor-pointer"
                                >
                                    {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Crear franja'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}