import { useEffect, useMemo, useState } from 'react'
import {
    ArrowLeft, Calendar, CheckCircle2, ClipboardList, Eye, FileCheck2, FileWarning, Filter,Home, Lock,
    Mail, MapPin, Phone, Search, ShieldCheck, User, Wallet, XCircle, Ban
} from 'lucide-react'
import VisorDocSeguroModal from '../../components/VisorDocSeguroModal'
import ModalCancelarPostulacion from '../../components/ModalCancelarPostulacion'
import { listarPostulacionesAdmin, cancelarPostulacion } from '../../services/postulacionesService'
import type { EstadoPostulacion, NombreCampoDocumento, PostulacionAdmin } from '../../types/postulacion'

const BADGE_ESTADO: Record<EstadoPostulacion, { etiqueta: string; clases: string }> = {
    PENDIENTE_REVISION: {
        etiqueta: 'Pendiente de revisión',
        clases: 'bg-amber-100 text-cafe ring-beige',
    },
    EN_REVISION: {
        etiqueta: 'Pendiente de revisión',
        clases: 'bg-amber-100 text-cafe ring-beige',
    },
    APROBADA: {
        etiqueta: 'Aprobada',
        clases: 'bg-green-100 text-green-800 ring-green-300',
    },
    RECHAZADA: {
        etiqueta: 'Rechazada',
        clases: 'bg-red-100 text-red-800 ring-red-200',
    },
    FINALIZADA: {
        etiqueta: 'Finalizada (Contrato firmado)',
        clases: 'bg-celeste/45 text-marino ring-celeste',
    },
    CANCELADA: {
        etiqueta: 'Cancelada',
        clases: 'bg-red-100 text-red-800 ring-red-200',
    },
}

function obtenerBadgeEstado(estado?: string) {
    if (estado && estado in BADGE_ESTADO) {
        return BADGE_ESTADO[estado as EstadoPostulacion]
    }
    return BADGE_ESTADO.PENDIENTE_REVISION
}

function formatearFecha(fechaISO?: string) {
    if (!fechaISO) return '—'
    try {
        const parteFecha = fechaISO.includes('T') ? fechaISO.split('T')[0] : fechaISO
        const partes = parteFecha.split('-').map(Number)
        if (partes.length < 3 || isNaN(partes[0]) || isNaN(partes[1]) || isNaN(partes[2])) {
            return fechaISO
        }
        return new Date(partes[0], partes[1] - 1, partes[2]).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return fechaISO
    }
}

export default function GestionPostulaciones() {
    const [postulaciones, setPostulaciones] = useState<PostulacionAdmin[]>([])
    const [cargando, setCargando] = useState(true)
    const [errorCarga, setErrorCarga] = useState<string | null>(null)

    // Filtros
    const [filtroFelino, setFiltroFelino] = useState('')
    const [filtroFecha, setFiltroFecha] = useState('')

    // Expediente seleccionado
    const [expedienteSeleccionado, setExpedienteSeleccionado] = useState<PostulacionAdmin | null>(null)

    // Visor seguro de documentos
    const [visorDoc, setVisorDoc] = useState<{
        abierto: boolean
        campo: NombreCampoDocumento | null
        titulo: string
    }>({
        abierto: false,
        campo: null,
        titulo: '',
    })

    useEffect(() => {
        listarPostulacionesAdmin()
            .then((data) => {
                setPostulaciones(data)
                setErrorCarga(null)
            })
            .catch((err) => {
                console.error('Error al cargar postulaciones admin:', err)
                setErrorCarga(err.message || 'Error al cargar las postulaciones.')
            })
            .finally(() => setCargando(false))
    }, [])

    const postulacionesFiltradas = useMemo(() => {
        return postulaciones.filter((p) => {
            const felino = (p.felinoNombre || '').toLowerCase()
            const idGato = (p.gatoId || '').toLowerCase()
            const filtro = filtroFelino.trim().toLowerCase()
            const coincideFelino = !filtro || felino.includes(filtro) || idGato.includes(filtro)

            const fechaP = p.fechaPostulacion || ''
            const coincideFecha = !filtroFecha || fechaP === filtroFecha

            return coincideFelino && coincideFecha
        })
    }, [postulaciones, filtroFelino, filtroFecha])

    const [modalBajaAbierto, setModalBajaAbierto] = useState(false)
    const [alertaAdmin, setAlertaAdmin] = useState<string | null>(null)

    async function confirmarBajaAdmin(motivoBaja: string) {
        if (!expedienteSeleccionado) return

        const actualizada = await cancelarPostulacion(
            expedienteSeleccionado.id,
            { motivo_baja: motivoBaja },
            { rol: 'ADMIN' }
        )

        setPostulaciones((prev) =>
            prev.map((p) => (p.id === actualizada.id ? actualizada : p))
        )
        setExpedienteSeleccionado(actualizada)
        setModalBajaAbierto(false)
        setAlertaAdmin(
            `La postulación de ${actualizada.postulanteNombre} fue cancelada y ${actualizada.felinoNombre} (${actualizada.gatoId}) volvió a estar disponible en el catálogo.`
        )
    }

    // VISTA DETALLE: EXPEDIENTE ADMINISTRATIVO EN MODO LECTURA
    if (expedienteSeleccionado) {
        const badge = obtenerBadgeEstado(expedienteSeleccionado.estado)

        return (
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                {/* Barra Superior */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <button
                            type="button"
                            onClick={() => setExpedienteSeleccionado(null)}
                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-marino/75 hover:text-marino cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver a la bandeja de postulaciones
                        </button>
                        <div className="mt-2 flex flex-wrap items-center gap-3">
                            <h1 className="font-heading text-2xl font-bold text-marino sm:text-3xl">
                                Expediente · {expedienteSeleccionado.postulanteNombre}
                            </h1>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${badge.clases}`}>
                                {badge.etiqueta}
                            </span>
                        </div>
                        <p className="mt-1 text-sm text-marino/70">
                            Solicitud para adoptar a{' '}
                            <strong className="text-marino">
                                {expedienteSeleccionado.felinoNombre} ({expedienteSeleccionado.gatoId})
                            </strong>{' '}
                            · Recibida el {formatearFecha(expedienteSeleccionado.fechaPostulacion)}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 self-start">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-crema px-3.5 py-2 text-xs font-semibold text-cafe ring-1 ring-beige">
                            <Lock className="h-4 w-4 shrink-0" />
                            <span>Modo lectura</span>
                        </div>

                        {(expedienteSeleccionado.estado === 'PENDIENTE_REVISION' ||
                            expedienteSeleccionado.estado === 'EN_REVISION' ||
                            expedienteSeleccionado.estado === 'APROBADA') && (
                            <button
                                type="button"
                                onClick={() => setModalBajaAbierto(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 cursor-pointer"
                            >
                                <Ban className="h-4 w-4" />
                                <span>Cancelar solicitud</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Alerta de confirmación tras cancelar */}
                {alertaAdmin && (
                    <div
                        role="alert"
                        className="flex items-center justify-between gap-3 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-900 ring-1 ring-green-600/30"
                    >
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-700" />
                            <span>{alertaAdmin}</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAlertaAdmin(null)}
                            className="text-xs font-bold underline cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                )}

                {/* Banner de Auditoría si la solicitud fue CANCELADA */}
                {expedienteSeleccionado.estado === 'CANCELADA' && (
                    <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-900 ring-1 ring-red-200">
                        <p className="font-heading font-bold">Solicitud cancelada</p>
                        <p className="mt-1 text-xs">
                            <strong>Motivo de baja:</strong> {expedienteSeleccionado.motivo_baja}
                        </p>
                        <p className="mt-1 text-xs text-red-800/80">
                            Cancelado por: <strong>{expedienteSeleccionado.cancelada_por}</strong> · Fecha de baja:{' '}
                            <strong>{expedienteSeleccionado.fecha_baja}</strong>
                        </p>
                    </div>
                )}

                {/* SECCIÓN 1: Información del Postulante */}
                <section
                    aria-labelledby="sec-postulante"
                    className="rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70"
                >
                    <div className="mb-4 flex items-center gap-2.5 border-b border-beige/50 pb-3">
                        <User className="h-5 w-5 text-cafe" />
                        <h2 id="sec-postulante" className="font-heading text-lg font-bold text-marino">
                            1. Información del postulante
                        </h2>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl bg-crema/50 p-3.5 ring-1 ring-beige/60">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-cafe">
                                <Mail className="h-3.5 w-3.5" />
                                Correo electrónico
                            </p>
                            <p className="mt-1 truncate text-sm font-bold text-marino">
                                {expedienteSeleccionado.postulanteEmail}
                            </p>
                        </div>

                        <div className="rounded-xl bg-crema/50 p-3.5 ring-1 ring-beige/60">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-cafe">
                                <Phone className="h-3.5 w-3.5" />
                                Teléfono de contacto
                            </p>
                            <p className="mt-1 text-sm font-bold text-marino">
                                {expedienteSeleccionado.telefonoContacto}
                            </p>
                        </div>

                        <div className="rounded-xl bg-crema/50 p-3.5 ring-1 ring-beige/60">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-cafe">
                                <Wallet className="h-3.5 w-3.5" />
                                Presupuesto mensual
                            </p>
                            <p className="mt-1 text-sm font-bold text-marino">
                                Bs. {expedienteSeleccionado.presupuestoMensual}
                            </p>
                        </div>

                        <div className="rounded-xl bg-crema/50 p-3.5 ring-1 ring-beige/60 sm:col-span-2 lg:col-span-1">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-cafe">
                                <MapPin className="h-3.5 w-3.5" />
                                Dirección del domicilio
                            </p>
                            <p className="mt-1 text-sm font-bold text-marino">
                                {expedienteSeleccionado.direccionDomicilio}
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 2: Cuestionario de Vivienda */}
                <section
                    aria-labelledby="sec-vivienda"
                    className="rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70"
                >
                    <div className="mb-4 flex items-center gap-2.5 border-b border-beige/50 pb-3">
                        <Home className="h-5 w-5 text-cafe" />
                        <h2 id="sec-vivienda" className="font-heading text-lg font-bold text-marino">
                            2. Cuestionario de vivienda y tenencia responsable
                        </h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <RespuestaBooleanaCard
                            pregunta="Mallas de protección"
                            valor={expedienteSeleccionado.tieneMallasProteccion}
                        />
                        <RespuestaBooleanaCard
                            pregunta="Permiso del propietario"
                            valor={expedienteSeleccionado.permisoPropietario}
                        />
                        <RespuestaBooleanaCard
                            pregunta="Compromiso de tenencia responsable"
                            valor={expedienteSeleccionado.compromisoTenenciaResponsable}
                        />
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-crema/40 p-4 ring-1 ring-beige/60">
                            <p className="text-xs font-semibold text-cafe">Otros animales en casa</p>
                            <p className="mt-1 text-sm font-medium text-marino">
                                {expedienteSeleccionado.otrosAnimalesEnCasa || 'No especificado'}
                            </p>
                        </div>

                        <div className="rounded-xl bg-crema/40 p-4 ring-1 ring-beige/60">
                            <p className="text-xs font-semibold text-cafe">
                                Horas al día que el felino estaría solo
                            </p>
                            <p className="mt-1 text-sm font-medium text-marino">
                                {expedienteSeleccionado.tiempoSoloAlDiaHoras !== undefined
                                    ? `${expedienteSeleccionado.tiempoSoloAlDiaHoras} horas al día`
                                    : 'No especificado'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* SECCIÓN 3: Documentación Adjunta (Visor Protegido) */}
                <section
                    aria-labelledby="sec-documentos"
                    className="rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70"
                >
                    <div className="mb-4 flex flex-col justify-between gap-2 border-b border-beige/50 pb-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2.5">
                            <FileCheck2 className="h-5 w-5 text-cafe" />
                            <h2 id="sec-documentos" className="font-heading text-lg font-bold text-marino">
                                3. Documentación adjunta
                            </h2>
                        </div>

                        {expedienteSeleccionado.documentacion_completa ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                                <ShieldCheck className="h-4 w-4" />
                                Documentación completa (3/3)
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-cafe">
                                <FileWarning className="h-4 w-4" />
                                Documentación incompleta
                            </span>
                        )}
                    </div>

                    <p className="mb-4 text-xs text-marino/70">
                        Los archivos están resguardados con cifrado AES-256. Al abrir un documento, se solicita autorización mediante tu sesión de administrador sin exponer rutas públicas.
                    </p>

                    <div className="grid gap-4 sm:grid-cols-3">
                        {expedienteSeleccionado.documentos.map((doc) => (
                            <div
                                key={doc.campo}
                                className="flex flex-col justify-between rounded-2xl border border-beige/80 bg-crema/40 p-4"
                            >
                                <div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span
                                            className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${doc.cargado
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-700'
                                                }`}
                                        >
                                            {doc.cargado ? 'Adjuntado' : 'Faltante'}
                                        </span>
                                    </div>

                                    <h3 className="mt-3 font-heading text-sm font-bold text-marino">
                                        {doc.etiqueta}
                                    </h3>
                                    <p className="mt-1 truncate text-xs text-marino/65">
                                        {doc.cargado ? doc.nombreArchivo : 'Sin archivo cargado'}
                                    </p>
                                </div>

                                <div className="mt-4 pt-3 border-t border-beige/40">
                                    <button
                                        type="button"
                                        disabled={!doc.cargado}
                                        onClick={() =>
                                            setVisorDoc({
                                                abierto: true,
                                                campo: doc.campo,
                                                titulo: doc.etiqueta,
                                            })
                                        }
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-marino px-3.5 py-2 text-xs font-semibold text-crema transition hover:bg-marino/90 disabled:bg-marino/25 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        <Eye className="h-3.5 w-3.5" />
                                        <span>Visualizar documento</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Modal Visor Seguro */}
                <VisorDocSeguroModal
                    abierto={visorDoc.abierto}
                    onCerrar={() => setVisorDoc({ abierto: false, campo: null, titulo: '' })}
                    postulacionId={expedienteSeleccionado.id}
                    campo={visorDoc.campo}
                    tituloDocumento={visorDoc.titulo}
                />
                <ModalCancelarPostulacion
                    abierto={modalBajaAbierto}
                    onCerrar={() => setModalBajaAbierto(false)}
                    onConfirmar={confirmarBajaAdmin}
                    esAdmin
                    identificadorFelino={`${expedienteSeleccionado.felinoNombre} (${expedienteSeleccionado.gatoId})`}
                    nombrePostulante={expedienteSeleccionado.postulanteNombre}
                />
            </div>
        )
    }

    // VISTA PRINCIPAL: BANDEJA DE POSTULACIONES
    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {/* Encabezado */}
            <header className="flex items-start gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-marino text-crema shadow-sm">
                    <ClipboardList className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="font-heading text-2xl font-semibold text-marino sm:text-3xl">
                        Postulaciones de adopción
                    </h1>
                    <p className="mt-1 text-sm text-marino/70">
                        Revisa las solicitudes recibidas, evalúa los cuestionarios de hogar y verifica la documentación cifrada.
                    </p>
                </div>
            </header>

            {/* Barra de Filtros (Por Felino y Fecha) */}
            <section
                aria-label="Filtros de postulaciones"
                className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70 sm:flex-row sm:items-end"
            >
                <div className="flex-1">
                    <label htmlFor="filtroFelino" className="block text-xs font-bold text-marino mb-1.5">
                        Filtrar por felino (nombre o código)
                    </label>
                    <div className="relative">
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-marino/45" />
                        <input
                            id="filtroFelino"
                            type="text"
                            placeholder="Ej. Oliver o CAT-PUB-01..."
                            value={filtroFelino}
                            onChange={(e) => setFiltroFelino(e.target.value)}
                            className="h-10 w-full rounded-xl border border-beige bg-white pr-4 pl-10 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                        />
                    </div>
                </div>

                <div className="sm:w-56">
                    <label htmlFor="filtroFecha" className="block text-xs font-bold text-marino mb-1.5">
                        Filtrar por fecha de envío
                    </label>
                    <input
                        id="filtroFecha"
                        type="date"
                        value={filtroFecha}
                        onChange={(e) => setFiltroFecha(e.target.value)}
                        className="h-10 w-full rounded-xl border border-beige bg-white px-3.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                    />
                </div>

                {(filtroFelino || filtroFecha) && (
                    <button
                        type="button"
                        onClick={() => {
                            setFiltroFelino('')
                            setFiltroFecha('')
                        }}
                        className="h-10 rounded-xl border border-beige bg-crema px-4 text-xs font-semibold text-marino hover:bg-celeste/30 cursor-pointer"
                    >
                        Limpiar filtros
                    </button>
                )}
            </section>

            {/* Alerta de error si falla la carga */}
            {errorCarga && (
                <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800 ring-1 ring-red-200">
                    <p className="font-bold">Error al cargar postulaciones</p>
                    <p className="mt-1 text-xs">{errorCarga}</p>
                </div>
            )}

            {/* Bandeja de Postulaciones */}
            {cargando ? (
                <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                        <div key={n} className="h-24 animate-pulse rounded-2xl bg-white/80 ring-1 ring-beige/60" />
                    ))}
                </div>
            ) : postulacionesFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-beige bg-white/60 p-12 text-center">
                    <Filter className="h-10 w-10 text-beige" />
                    <h2 className="mt-3 font-heading text-lg font-bold text-marino">
                        No se encontraron postulaciones
                    </h2>
                    <p className="mt-1 text-sm text-marino/65">
                        No hay solicitudes que coincidan con los filtros aplicados.
                    </p>
                </div>
            ) : (
                <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70">
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-b border-beige/60 bg-crema/70 text-xs font-bold uppercase tracking-wider text-marino/75">
                                    <th className="px-5 py-3.5">Postulante</th>
                                    <th className="px-5 py-3.5">Felino</th>
                                    <th className="px-5 py-3.5">Fecha</th>
                                    <th className="px-5 py-3.5">Documentación</th>
                                    <th className="px-5 py-3.5">Estado</th>
                                    <th className="px-5 py-3.5 text-right">Expediente</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-beige/40">
                                {postulacionesFiltradas.map((item) => {
                                    const badge = obtenerBadgeEstado(item.estado)

                                    return (
                                        <tr key={item.id} className="transition hover:bg-crema/35">
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-marino">{item.postulanteNombre}</p>
                                                <p className="text-xs text-marino/60">{item.postulanteEmail}</p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-bold text-marino">{item.felinoNombre}</p>
                                                <p className="text-xs font-medium text-cafe">{item.gatoId}</p>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap text-marino/80">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5 text-cafe" />
                                                    {formatearFecha(item.fechaPostulacion)}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                {item.documentacion_completa ? (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                                        Completa
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-cafe">
                                                        <FileWarning className="h-3.5 w-3.5" />
                                                        Incompleta
                                                    </span>
                                                )}
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap">
                                                <span
                                                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badge.clases}`}
                                                >
                                                    {badge.etiqueta}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 text-right whitespace-nowrap">
                                                <button
                                                    type="button"
                                                    onClick={() => setExpedienteSeleccionado(item)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-marino px-3.5 py-2 text-xs font-semibold text-crema transition hover:bg-marino/90 cursor-pointer"
                                                >
                                                    <Eye className="h-3.5 w-3.5" />
                                                    <span>Ver expediente</span>
                                                </button>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    )
}

function RespuestaBooleanaCard({
    pregunta,
    valor,
}: {
    pregunta: string
    valor: boolean
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl bg-crema/50 p-3.5 ring-1 ring-beige/60">
            <span className="text-xs font-semibold text-marino">{pregunta}</span>
            {valor ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-bold text-green-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Sí
                </span>
            ) : (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-bold text-red-700">
                    <XCircle className="h-3.5 w-3.5" />
                    No
                </span>
            )}
        </div>
    )
}