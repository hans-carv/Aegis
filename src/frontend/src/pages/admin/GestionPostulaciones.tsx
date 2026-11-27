import { useEffect, useMemo, useState } from 'react'
import {
    ArrowLeft, Calendar, CalendarCheck, CheckCircle2, ClipboardList, Eye, FileCheck2, FileWarning, Filter,Home, Lock,
    Mail, MapPin, Phone, Search, ShieldCheck, User, Wallet, XCircle, Ban,
    ClipboardCheck, Clock, ExternalLink, Wrench, Image as ImageIcon
} from 'lucide-react'
import VisorDocSeguroModal from '../../components/VisorDocSeguroModal'
import ModalCancelarPostulacion from '../../components/ModalCancelarPostulacion'
import ModalProgramarVisita from '../../components/ModalProgramarVisita'
import ModalEmitirDictamen from '../../components/ModalEmitirDictamen'
import { listarPostulacionesAdmin, cancelarPostulacion } from '../../services/postulacionesService'
import {
    listarAgendaVisitas,
    obtenerVisitaPorPostulacion,
    validarHabilitadoParaContrato,
} from '../../services/visitasDomiciliariasService'
import type { EstadoPostulacion, NombreCampoDocumento, PostulacionAdmin } from '../../types/postulacion'
import type { VisitaDomiciliaria } from '../../types/visitaDomiciliaria'

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
    VISITA_PROGRAMADA: {
        etiqueta: 'Visita domiciliaria programada',
        clases: 'bg-celeste/45 text-marino ring-celeste',
    },
    PENDIENTE_ADECUACIONES: {
        etiqueta: 'Pendiente de adecuaciones',
        clases: 'bg-amber-100 text-cafe ring-beige',
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
    const [subTab, setSubTab] = useState<'postulaciones' | 'agenda'>('postulaciones')
    
    const [postulaciones, setPostulaciones] = useState<PostulacionAdmin[]>([])
    const [cargando, setCargando] = useState(true)
    const [errorCarga, setErrorCarga] = useState<string | null>(null)

    // Agenda de visitas domiciliarias
    const [agendaVisitas, setAgendaVisitas] = useState<VisitaDomiciliaria[]>([])
    const [cargandoAgenda, setCargandoAgenda] = useState(false)
    const [filtroFechaAgenda, setFiltroFechaAgenda] = useState('')

    // Filtros
    const [filtroFelino, setFiltroFelino] = useState('')
    const [filtroFecha, setFiltroFecha] = useState('')

    // Expediente seleccionado y visita asociada
    const [expedienteSeleccionado, setExpedienteSeleccionado] = useState<PostulacionAdmin | null>(null)
    const [visitaExpediente, setVisitaExpediente] = useState<VisitaDomiciliaria | null>(null)
    const [estadoContratoInfo, setEstadoContratoInfo] = useState<{
        habilitado: boolean
        mensaje: string
    } | null>(null)

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

    function cargarPostulaciones() {
        setCargando(true)
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
    }

    function cargarAgenda(fecha?: string) {
        setCargandoAgenda(true)
        listarAgendaVisitas(fecha || undefined)
            .then(setAgendaVisitas)
            .catch((err) => console.error('Error al cargar agenda de visitas:', err))
            .finally(() => setCargandoAgenda(false))
    }

    useEffect(() => {
        cargarPostulaciones()
    }, [])

    useEffect(() => {
        if (subTab === 'agenda') {
            cargarAgenda(filtroFechaAgenda)
        }
    }, [subTab, filtroFechaAgenda])

    // Cargar visita y estado de contrato cuando se abre un expediente
    useEffect(() => {
        if (!expedienteSeleccionado) {
            setVisitaExpediente(null)
            setEstadoContratoInfo(null)
            return
        }

        obtenerVisitaPorPostulacion(expedienteSeleccionado.id)
            .then(setVisitaExpediente)
            .catch(() => setVisitaExpediente(null))

        validarHabilitadoParaContrato(expedienteSeleccionado.id)
            .then(() =>
                setEstadoContratoInfo({
                    habilitado: true,
                    mensaje: 'Dictamen domiciliario APROBADO. La solicitud está habilitada para formalizar el contrato.',
                })
            )
            .catch((err) =>
                setEstadoContratoInfo({
                    habilitado: false,
                    mensaje:
                        err instanceof Error
                            ? err.message
                            : 'Aún no habilitada para formalizar contrato (requiere dictamen domiciliario APROBADA).',
                })
            )
    }, [expedienteSeleccionado])

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
    const [modalProgramarVisitaAbierto, setModalProgramarVisitaAbierto] = useState(false)
    const [visitaParaDictamen, setVisitaParaDictamen] = useState<VisitaDomiciliaria | null>(null)
    const [alertaAdmin, setAlertaAdmin] = useState<string | null>(null)

    async function confirmarBajaAdmin(motivoBaja: string) {
        if (!expedienteSeleccionado) return

        const datosCancelacion = await cancelarPostulacion(
            expedienteSeleccionado.id,
            { motivo_baja: motivoBaja },
            { rol: 'ADMIN' }
        )

        const actualizada: PostulacionAdmin = {
            ...expedienteSeleccionado,
            ...datosCancelacion,
            estado: 'CANCELADA',
            motivo_baja: datosCancelacion.motivo_baja || motivoBaja,
            cancelada_por: 'ADMIN',
            fecha_baja: datosCancelacion.fecha_baja || new Date().toISOString().split('T')[0],
        }

        setPostulaciones((prev) =>
            prev.map((p) => (p.id === actualizada.id ? actualizada : p))
        )
        setExpedienteSeleccionado(actualizada)
        setModalBajaAbierto(false)
        setAlertaAdmin(
            `La postulación de ${actualizada.postulanteNombre} fue cancelada y ${actualizada.felinoNombre} (${actualizada.gatoId}) volvió a estar disponible en el catálogo.`
        )
    }

    function manejarVisitaProgramada(nuevaVisita: VisitaDomiciliaria) {
        setVisitaExpediente(nuevaVisita)
        setModalProgramarVisitaAbierto(false)

        if (expedienteSeleccionado) {
            const actualizada: PostulacionAdmin = {
                ...expedienteSeleccionado,
                estado: 'VISITA_PROGRAMADA',
            }
            setExpedienteSeleccionado(actualizada)
            setPostulaciones((prev) =>
                prev.map((p) => (p.id === actualizada.id ? actualizada : p))
            )
        }
        setAlertaAdmin(
            `Visita domiciliaria programada para el ${nuevaVisita.fechaVisita} (${nuevaVisita.horaInicio} - ${nuevaVisita.horaFin}).`
        )
    }

    function manejarDictamenEmitido(visitaActualizada: VisitaDomiciliaria) {
        setVisitaParaDictamen(null)
        const nuevoEstadoPostulacion: EstadoPostulacion =
            visitaActualizada.dictamen === 'APROBADA'
                ? 'APROBADA'
                : visitaActualizada.dictamen === 'RECHAZADA'
                    ? 'RECHAZADA'
                    : 'PENDIENTE_ADECUACIONES'

        // Actualizar expediente si está abierto
        if (expedienteSeleccionado && expedienteSeleccionado.id === visitaActualizada.postulacionId) {
            setVisitaExpediente(visitaActualizada)
            const postActualizada: PostulacionAdmin = {
                ...expedienteSeleccionado,
                estado: nuevoEstadoPostulacion,
            }
            setExpedienteSeleccionado(postActualizada)
            setEstadoContratoInfo(
                visitaActualizada.dictamen === 'APROBADA'
                    ? {
                        habilitado: true,
                        mensaje: 'Dictamen domiciliario APROBADO. La solicitud está habilitada para formalizar el contrato.',
                    }
                    : {
                        habilitado: false,
                        mensaje: `Bloqueo de contrato: el dictamen domiciliario actual es '${visitaActualizada.dictamen}'.`,
                    }
            )
        }

        // Actualizar lista de postulaciones y agenda
        setPostulaciones((prev) =>
            prev.map((p) =>
                p.id === visitaActualizada.postulacionId
                    ? { ...p, estado: nuevoEstadoPostulacion }
                    : p
            )
        )
        setAgendaVisitas((prev) =>
            prev.map((v) => (v.id === visitaActualizada.id ? { ...v, ...visitaActualizada } : v))
        )

        setAlertaAdmin(
            visitaActualizada.dictamen === 'RECHAZADA'
                ? 'Dictamen RECHAZADA registrado. La postulación fue rechazada y el felino volvió al catálogo.'
                : `Dictamen ${visitaActualizada.dictamen} registrado correctamente.`
        )
    }

    // VISTA DETALLE: EXPEDIENTE ADMINISTRATIVO EN MODO LECTURA
    if (expedienteSeleccionado) {
        const badge = obtenerBadgeEstado(expedienteSeleccionado.estado)

        const puedeProgramarVisita =
            expedienteSeleccionado.documentacion_completa &&
            expedienteSeleccionado.estado !== 'CANCELADA' &&
            expedienteSeleccionado.estado !== 'RECHAZADA' &&
            expedienteSeleccionado.estado !== 'FINALIZADA'

        return (
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
                {/* Barra Superior */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <button
                            type="button"
                            onClick={() => {setExpedienteSeleccionado(null) 
                                setAlertaAdmin(null)}}
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

                        {puedeProgramarVisita && (
                            <button
                                type="button"
                                onClick={() => setModalProgramarVisitaAbierto(true)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-marino px-3.5 py-2 text-xs font-semibold text-crema transition hover:bg-marino/90 cursor-pointer"
                            >
                                <CalendarCheck className="h-4 w-4" />
                                <span>Programar visita</span>
                            </button>
                        )}

                        {(expedienteSeleccionado.estado === 'PENDIENTE_REVISION' ||
                            expedienteSeleccionado.estado === 'EN_REVISION' || 
                            expedienteSeleccionado.estado === 'VISITA_PROGRAMADA' ||
                            expedienteSeleccionado.estado === 'PENDIENTE_ADECUACIONES' ||
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
                        {(expedienteSeleccionado.documentos || []).map((doc, idx) => {
                            const cargado = Boolean(doc?.cargado)
                            const etiqueta = doc?.etiqueta || 'Documento de respaldo'
                            const nombreArchivo = doc?.nombreArchivo || (cargado ? 'Archivo cargado' : 'Sin archivo cargado')
                            const campo = doc?.campo || null

                            return (
                                <div
                                    key={campo || idx}
                                    className="flex flex-col justify-between rounded-2xl border border-beige/80 bg-crema/40 p-4"
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2">
                                            <span
                                                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cargado
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-700'
                                                    }`}
                                            >
                                                {cargado ? 'Adjuntado' : 'Faltante'}
                                            </span>
                                        </div>

                                        <h3 className="mt-3 font-heading text-sm font-bold text-marino">
                                            {etiqueta}
                                        </h3>
                                        <p className="mt-1 truncate text-xs text-marino/65">
                                            {nombreArchivo}
                                        </p>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-beige/40">
                                        <button
                                            type="button"
                                            disabled={!cargado || !campo}
                                            onClick={() => {
                                                if (campo) {
                                                    setVisorDoc({
                                                        abierto: true,
                                                        campo,
                                                        titulo: etiqueta,
                                                    })
                                                }
                                            }}
                                            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-marino px-3.5 py-2 text-xs font-semibold text-crema transition hover:bg-marino/90 disabled:bg-marino/25 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            <Eye className="h-3.5 w-3.5" />
                                            <span>Visualizar documento</span>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* SECCIÓN 4: Visita Domiciliaria y Habilitación de Contrato */}
                <section
                    aria-labelledby="sec-visita-domiciliaria"
                    className="rounded-2xl bg-white p-6 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70"
                >
                    <div className="mb-4 flex flex-col justify-between gap-2 border-b border-beige/50 pb-3 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-2.5">
                            <CalendarCheck className="h-5 w-5 text-cafe" />
                            <h2 id="sec-visita-domiciliaria" className="font-heading text-lg font-bold text-marino">
                                4. Evaluación domiciliaria y habilitación de contrato
                            </h2>
                        </div>

                        {visitaExpediente && visitaExpediente.estado !== 'CANCELADA' && (
                            <button
                                type="button"
                                onClick={() => setVisitaParaDictamen(visitaExpediente)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-marino px-3.5 py-2 text-xs font-semibold text-crema transition hover:bg-marino/90 cursor-pointer"
                            >
                                <ClipboardCheck className="h-4 w-4" />
                                <span>
                                    {visitaExpediente.dictamen ? 'Actualizar dictamen' : 'Emitir dictamen'}
                                </span>
                            </button>
                        )}
                    </div>

                    {!visitaExpediente ? (
                        <div className="rounded-2xl border border-dashed border-beige bg-crema/40 p-6 text-center">
                            <p className="text-sm font-semibold text-marino">
                                Aún no se ha programado una visita domiciliaria para esta solicitud.
                            </p>
                            <p className="mt-1 text-xs text-marino/70">
                                {expedienteSeleccionado.documentacion_completa
                                    ? 'Puedes agendarla desde el botón "Programar visita" en la barra superior.'
                                    : 'Se requiere completar los 3 documentos obligatorios antes de programar la visita.'}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="rounded-xl bg-crema/50 p-3.5 ring-1 ring-beige/60">
                                    <p className="text-xs font-semibold text-cafe">Fecha y horario</p>
                                    <p className="mt-1 text-sm font-bold text-marino">
                                        {formatearFecha(visitaExpediente.fechaVisita)}
                                    </p>
                                    <p className="text-xs text-marino/75">
                                        {visitaExpediente.horaInicio} – {visitaExpediente.horaFin}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-crema/50 p-3.5 ring-1 ring-beige/60">
                                    <p className="text-xs font-semibold text-cafe">Estado de visita</p>
                                    <p className="mt-1 text-sm font-bold text-marino">
                                        {visitaExpediente.estado}
                                    </p>
                                </div>

                                <div className="rounded-xl bg-crema/50 p-3.5 ring-1 ring-beige/60">
                                    <p className="text-xs font-semibold text-cafe">Dictamen emitido</p>
                                    <p className="mt-1 text-sm font-bold text-marino">
                                        {visitaExpediente.dictamen || 'Pendiente de evaluación'}
                                    </p>
                                    {visitaExpediente.fechaLimiteSubsanacion && (
                                        <p className="text-[11px] text-cafe">
                                            Límite subsanación: {visitaExpediente.fechaLimiteSubsanacion}
                                        </p>
                                    )}
                                </div>

                                <div className="rounded-xl bg-crema/50 p-3.5 ring-1 ring-beige/60">
                                    <p className="text-xs font-semibold text-cafe">Dirección confirmada</p>
                                    <p className="mt-1 text-xs font-bold text-marino">
                                        {visitaExpediente.direccionConfirmada}
                                    </p>
                                </div>
                            </div>

                            {visitaExpediente.observacionesDictamen && (
                                <div className="rounded-xl bg-crema/40 p-3.5 text-xs text-marino ring-1 ring-beige/60">
                                    <strong className="text-cafe">Observaciones del dictamen: </strong>
                                    {visitaExpediente.observacionesDictamen}
                                </div>
                            )}

                            {/* Evidencias fotográficas registradas por el postulante */}
                            {visitaExpediente.evidenciaAdecuacionesUrls &&
                                visitaExpediente.evidenciaAdecuacionesUrls.length > 0 && (
                                    <div className="space-y-2 rounded-2xl bg-crema/40 p-4 ring-1 ring-beige/60">
                                        <p className="flex items-center gap-1.5 text-xs font-bold text-marino">
                                            <Wrench className="h-4 w-4 text-cafe" />
                                            Evidencias de adecuaciones registradas por el postulante ({visitaExpediente.evidenciaAdecuacionesUrls.length})
                                        </p>
                                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                                            {visitaExpediente.evidenciaAdecuacionesUrls.map((url, idx) => (
                                                <a
                                                    key={`${url}-${idx}`}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="group overflow-hidden rounded-xl border border-beige bg-white"
                                                >
                                                    <div className="relative h-24 w-full bg-crema">
                                                        <img
                                                            src={url}
                                                            alt={`Evidencia ${idx + 1}`}
                                                            className="h-full w-full object-cover transition group-hover:scale-105"
                                                        />
                                                        <span className="absolute top-1.5 right-1.5 rounded bg-marino/80 p-1 text-crema">
                                                            <ExternalLink className="h-3 w-3" />
                                                        </span>
                                                    </div>
                                                    <p className="flex items-center gap-1 truncate px-2 py-1 text-[11px] text-marino/80">
                                                        <ImageIcon className="h-3 w-3 shrink-0 text-cafe" />
                                                        <span className="truncate">{url}</span>
                                                    </p>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </div>
                    )}

                    {/* Validación para formalización del contrato */}
                    {estadoContratoInfo && (
                        <div
                            className={`mt-4 flex items-center gap-2.5 rounded-xl p-3.5 text-xs font-semibold ring-1 ${
                                estadoContratoInfo.habilitado
                                    ? 'bg-green-50 text-green-900 ring-green-300'
                                    : 'bg-amber-50/80 text-cafe ring-beige'
                            }`}
                        >
                            {estadoContratoInfo.habilitado ? (
                                <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700" />
                            ) : (
                                <Lock className="h-4 w-4 shrink-0 text-cafe" />
                            )}
                            <span>{estadoContratoInfo.mensaje}</span>
                        </div>
                    )}
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
                <ModalProgramarVisita
                    abierto={modalProgramarVisitaAbierto}
                    onCerrar={() => setModalProgramarVisitaAbierto(false)}
                    postulacion={expedienteSeleccionado}
                    onVisitaProgramada={manejarVisitaProgramada}
                />
                {visitaParaDictamen && (
                    <ModalEmitirDictamen
                        abierto={Boolean(visitaParaDictamen)}
                        onCerrar={() => setVisitaParaDictamen(null)}
                        visita={visitaParaDictamen}
                        onDictamenEmitido={manejarDictamenEmitido}
                    />
                )}
            </div>
        )
    }

    // VISTA PRINCIPAL: BANDEJA DE POSTULACIONES Y AGENDA DE VISITAS
    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
            {/* Encabezado */}
            <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-marino text-crema shadow-sm">
                        <ClipboardList className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="font-heading text-2xl font-semibold text-marino sm:text-3xl">
                            Postulaciones y visitas domiciliarias
                        </h1>
                        <p className="mt-1 text-sm text-marino/70">
                            Revisa las solicitudes recibidas, evalúa los cuestionarios de hogar, verifica la documentación cifrada y gestiona la agenda de evaluaciones de hogar.
                        </p>
                    </div>
                </div>
            </header>

            {/* Pestañas Administrativas */}
            <div className="flex gap-2 border-b border-beige/70 pb-px overflow-x-auto">
                <button
                    type="button"
                    onClick={() => setSubTab('postulaciones')}
                    className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                        subTab === 'postulaciones'
                            ? 'border-marino text-marino'
                            : 'border-transparent text-marino/60 hover:text-marino'
                    }`}
                >
                    <ClipboardList className="h-4 w-4" />
                    <span>Solicitudes de adopción</span>
                    <span className="rounded-full bg-crema px-2 py-0.5 text-xs font-bold text-cafe ring-1 ring-beige">
                        {postulaciones.length}
                    </span>
                </button>

                <button
                    type="button"
                    onClick={() => setSubTab('agenda')}
                    className={`inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition cursor-pointer ${
                        subTab === 'agenda'
                            ? 'border-marino text-marino'
                            : 'border-transparent text-marino/60 hover:text-marino'
                    }`}
                >
                    <CalendarCheck className="h-4 w-4" />
                    <span>Agenda de visitas domiciliarias</span>
                </button>
            </div>

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

            {/* CONTENIDO TAB 1: BANDEJA DE POSTULACIONES */}
            {subTab === 'postulaciones' && (
                <>
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

                    {errorCarga && (
                        <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-800 ring-1 ring-red-200">
                            <p className="font-bold">Error al cargar postulaciones</p>
                            <p className="mt-1 text-xs">{errorCarga}</p>
                        </div>
                    )}

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
                </>
            )}

            {/* CONTENIDO TAB 2: AGENDA DE VISITAS DOMICILIARIAS */}
            {subTab === 'agenda' && (
                <div className="space-y-4">
                    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70 sm:flex-row sm:items-end">
                        <div className="sm:w-64">
                            <label htmlFor="filtroFechaAgenda" className="block text-xs font-bold text-marino mb-1.5">
                                Filtrar agenda por fecha
                            </label>
                            <input
                                id="filtroFechaAgenda"
                                type="date"
                                value={filtroFechaAgenda}
                                onChange={(e) => setFiltroFechaAgenda(e.target.value)}
                                className="h-10 w-full rounded-xl border border-beige bg-white px-3.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                            />
                        </div>

                        {filtroFechaAgenda && (
                            <button
                                type="button"
                                onClick={() => setFiltroFechaAgenda('')}
                                className="h-10 rounded-xl border border-beige bg-crema px-4 text-xs font-semibold text-marino hover:bg-celeste/30 cursor-pointer"
                            >
                                Ver todas las fechas
                            </button>
                        )}
                    </div>

                    {cargandoAgenda ? (
                        <div className="space-y-3">
                            {[1, 2].map((n) => (
                                <div key={n} className="h-24 animate-pulse rounded-2xl bg-white/80 ring-1 ring-beige/60" />
                            ))}
                        </div>
                    ) : agendaVisitas.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-beige bg-white/60 p-12 text-center">
                            <CalendarCheck className="h-10 w-10 text-beige" />
                            <h2 className="mt-3 font-heading text-lg font-bold text-marino">
                                No hay visitas domiciliarias programadas
                            </h2>
                            <p className="mt-1 text-sm text-marino/65">
                                Puedes agendar una visita abriendo el expediente de una solicitud con documentación completa.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(23,38,65,0.05)] ring-1 ring-beige/70">
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-beige/60 bg-crema/70 text-xs font-bold uppercase tracking-wider text-marino/75">
                                            <th className="px-5 py-3.5">Fecha y Horario</th>
                                            <th className="px-5 py-3.5">Postulante / Felino</th>
                                            <th className="px-5 py-3.5">Dirección confirmada</th>
                                            <th className="px-5 py-3.5">Estado / Dictamen</th>
                                            <th className="px-5 py-3.5 text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-beige/40">
                                        {agendaVisitas.map((visita) => (
                                            <tr key={visita.id} className="transition hover:bg-crema/35">
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <p className="font-bold text-marino">
                                                        {formatearFecha(visita.fechaVisita)}
                                                    </p>
                                                    <p className="inline-flex items-center gap-1 text-xs text-cafe">
                                                        <Clock className="h-3.5 w-3.5" />
                                                        {visita.horaInicio} – {visita.horaFin}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-bold text-marino">{visita.postulanteNombre || 'Postulante'}</p>
                                                    <p className="text-xs text-cafe">{visita.gatoNombre || visita.gatoId}</p>
                                                </td>

                                                <td className="px-5 py-4 text-xs text-marino/80 max-w-xs truncate">
                                                    {visita.direccionConfirmada}
                                                </td>

                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <span
                                                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
                                                            visita.dictamen === 'APROBADA'
                                                                ? 'bg-green-100 text-green-800 ring-green-300'
                                                                : visita.dictamen === 'RECHAZADA'
                                                                    ? 'bg-red-100 text-red-800 ring-red-200'
                                                                    : 'bg-amber-100 text-cafe ring-beige'
                                                        }`}
                                                    >
                                                        {visita.dictamen || visita.estado}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                                    {visita.estado !== 'CANCELADA' && (
                                                        <button
                                                            type="button"
                                                            onClick={() => setVisitaParaDictamen(visita)}
                                                            className="inline-flex items-center gap-1.5 rounded-xl bg-marino px-3.5 py-2 text-xs font-semibold text-crema transition hover:bg-marino/90 cursor-pointer"
                                                        >
                                                            <ClipboardCheck className="h-3.5 w-3.5" />
                                                            <span>
                                                                {visita.dictamen ? 'Editar dictamen' : 'Emitir dictamen'}
                                                            </span>
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {visitaParaDictamen && (
                        <ModalEmitirDictamen
                            abierto={Boolean(visitaParaDictamen)}
                            onCerrar={() => setVisitaParaDictamen(null)}
                            visita={visitaParaDictamen}
                            onDictamenEmitido={manejarDictamenEmitido}
                        />
                    )}
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