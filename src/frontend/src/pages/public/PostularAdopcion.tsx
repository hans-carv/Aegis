import { useState } from 'react'
import { Link, useParams } from 'react-router'
import {
    AlertCircle, ArrowLeft, ArrowRight, Check, CheckCircle2, ClipboardCheck,
    FileCheck2, Home, Lock, Send, ShieldCheck, UserCheck,
} from 'lucide-react'
import DocumentoDropzone from '../../components/DocumentoDropZone'
import { crearPostulacion, PostulacionApiError, subirDocumentosPostulacion,
} from '../../services/postulacionesService'
import type { NombreCampoDocumento, PostulacionRegistrada } from '../../types/postulacion'
import { useAuth } from '../../hooks/useAuth'

const PASOS = [
    { numero: 1, titulo: 'Datos del postulante', icono: UserCheck },
    { numero: 2, titulo: 'Vivienda y tenencia', icono: Home },
    { numero: 3, titulo: 'Documentación', icono: FileCheck2 },
    { numero: 4, titulo: 'Revisión y envío', icono: ClipboardCheck },
] as const

export default function PostularAdopcion() {
    const { gatoId } = useParams<{ gatoId: string }>()
    const { usuario } = useAuth()

    const [pasoActual, setPasoActual] = useState(1)
    const [errorPaso, setErrorPaso] = useState<string | null>(null)

    // Paso 1: Datos del postulante
    const [presupuestoMensual, setPresupuestoMensual] = useState('')
    const [telefonoContacto, setTelefonoContacto] = useState('')
    const [direccionDomicilio, setDireccionDomicilio] = useState('')

    // Paso 2: Cuestionario de vivienda y tenencia responsable
    const [tieneMallasProteccion, setTieneMallasProteccion] = useState<boolean | null>(null)
    const [permisoPropietario, setPermisoPropietario] = useState<boolean | null>(null)
    const [compromisoTenenciaResponsable, setCompromisoTenenciaResponsable] = useState<boolean | null>(null)
    const [otrosAnimalesEnCasa, setOtrosAnimalesEnCasa] = useState('')
    const [tiempoSoloAlDiaHoras, setTiempoSoloAlDiaHoras] = useState('')

    // Paso 3: Documentos
    const [carnetIdentidad, setCarnetIdentidad] = useState<File | null>(null)
    const [facturaServicio, setFacturaServicio] = useState<File | null>(null)
    const [croquisDomicilio, setCroquisDomicilio] = useState<File | null>(null)

    // Paso 4: Envío y estado final inmutable
    const [enviando, setEnviando] = useState(false)
    const [estadoProceso, setEstadoProceso] = useState<string>('')
    const [postulacionCompletada, setPostulacionCompletada] = useState<PostulacionRegistrada | null>(null)

    function manejarSeleccionArchivo(campo: NombreCampoDocumento, file: File) {
        setErrorPaso(null)
        if (campo === 'carnetIdentidad') setCarnetIdentidad(file)
        if (campo === 'facturaServicio') setFacturaServicio(file)
        if (campo === 'croquisDomicilio') setCroquisDomicilio(file)
    }

    function validarPaso(paso: number): string | null {
        if (paso === 1) {
            const presupuesto = Number(presupuestoMensual)
            if (!presupuestoMensual || isNaN(presupuesto) || presupuesto <= 0) {
                return 'Ingresa un presupuesto mensual estimado válido mayor a 0.'
            }
            if (!telefonoContacto.trim() || telefonoContacto.trim().length < 7) {
                return 'Ingresa un teléfono de contacto válido.'
            }
            if (!direccionDomicilio.trim() || direccionDomicilio.trim().length < 5) {
                return 'Ingresa la dirección completa de tu domicilio.'
            }
        }

        if (paso === 2) {
            if (
                tieneMallasProteccion === null ||
                permisoPropietario === null ||
                compromisoTenenciaResponsable === null
            ) {
                return 'Por favor responde Sí o No a las tres preguntas obligatorias de seguridad y tenencia.'
            }
            if (tiempoSoloAlDiaHoras !== '') {
                const horas = Number(tiempoSoloAlDiaHoras)
                if (isNaN(horas) || horas < 0 || horas > 24) {
                    return 'Las horas que estará solo el felino deben estar entre 0 y 24.'
                }
            }
        }

        if (paso === 3) {
            if (!carnetIdentidad || !facturaServicio || !croquisDomicilio) {
                return 'Debes adjuntar los tres documentos obligatorios antes de continuar.'
            }
        }

        return null
    }

    function avanzarPaso() {
        const error = validarPaso(pasoActual)
        if (error) {
            setErrorPaso(error)
            return
        }
        setErrorPaso(null)
        setPasoActual((prev) => Math.min(4, prev + 1))
    }

    function retrocederPaso() {
        setErrorPaso(null)
        setPasoActual((prev) => Math.max(1, prev - 1))
    }

    async function manejarEnvioFinal() {
        if (!gatoId || !carnetIdentidad || !facturaServicio || !croquisDomicilio) return
        if (
            tieneMallasProteccion === null ||
            permisoPropietario === null ||
            compromisoTenenciaResponsable === null
        ) {
            return
        }

        setErrorPaso(null)
        setEnviando(true)

        try {
            // 1. Crear la postulación (POST /api/postulaciones)
            setEstadoProceso('Registrando datos de tu postulación...')
            const postulacionCreada = await crearPostulacion(
                {
                gatoId,
                presupuestoMensual: Number(presupuestoMensual),
                telefonoContacto: telefonoContacto.trim(),
                direccionDomicilio: direccionDomicilio.trim(),
                tieneMallasProteccion,
                permisoPropietario,
                compromisoTenenciaResponsable,
                ...(otrosAnimalesEnCasa.trim() ? { otrosAnimalesEnCasa: otrosAnimalesEnCasa.trim() } : {}),
                ...(tiempoSoloAlDiaHoras !== '' ? { tiempoSoloAlDiaHoras: Number(tiempoSoloAlDiaHoras) } : {}),
                }, 
                { nombre: usuario?.nombre, email:usuario?.email,}
            )

            // 2. Subir los documentos con el ID devuelto (multipart/form-data)
            setEstadoProceso('Cifrando y subiendo documentación...')
            const finalizada = await subirDocumentosPostulacion(postulacionCreada.id, {
                carnetIdentidad,
                facturaServicio,
                croquisDomicilio,
            })

            setPostulacionCompletada({
                ...postulacionCreada,
                ...finalizada,
                gatoId: postulacionCreada.gatoId || gatoId || '',
            })
        } catch (err) {
            if (err instanceof PostulacionApiError) {
                setErrorPaso(err.message)
            } else {
                setErrorPaso('Ocurrió un error inesperado al procesar tu postulación. Inténtalo nuevamente.')
            }
        } finally {
            setEnviando(false)
            setEstadoProceso('')
        }
    }

    // Pantalla de Confirmación Final (Cuestionario Inmutable)
    if (postulacionCompletada) {
        return (
            <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
                <div className="rounded-3xl bg-white p-8 text-center shadow-[0_18px_50px_rgba(23,38,65,0.08)] ring-1 ring-beige/70 sm:p-10">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                        <CheckCircle2 className="h-9 w-9" />
                    </div>

                    <span className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-cafe">
                        Pendiente de revisión
                    </span>

                    <h1 className="mt-3 font-heading text-2xl font-bold text-marino sm:text-3xl">
                        ¡Postulación registrada con éxito!
                    </h1>

                    <p className="mt-3 text-sm leading-relaxed text-marino/75 sm:text-base">
                        Hemos recibido tu solicitud para adoptar al felino <strong>{postulacionCompletada.gatoId}</strong> junto con tu documentación respaldada y cifrada. Nuestro equipo evaluará tu perfil y se pondrá en contacto contigo pronto.
                    </p>

                    <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-crema p-3 text-xs font-medium text-marino/75 ring-1 ring-beige">
                        <Lock className="h-4 w-4 shrink-0 text-cafe" />
                        <span>
                            Esta solicitud ha quedado cerrada y no admite modificaciones posteriores.
                        </span>
                    </div>

                    <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                        <Link
                            to="/perfil"
                            className="inline-flex items-center justify-center rounded-xl bg-marino px-6 py-3 text-sm font-semibold text-crema transition hover:bg-marino/90"
                        >
                            Ver mis postulaciones
                        </Link>
                        <Link
                            to="/catalogo"
                            className="inline-flex items-center justify-center rounded-xl border border-beige bg-white px-6 py-3 text-sm font-semibold text-marino transition hover:bg-crema"
                        >
                            Volver al catálogo
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 md:px-8">
            {/* Navegación superior */}
            <div className="mb-6">
                <Link
                    to="/catalogo"
                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-marino/75 hover:text-marino"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al catálogo
                </Link>
                <h1 className="mt-2 font-heading text-2xl font-bold text-marino sm:text-3xl">
                    Solicitud de adopción · <span className="text-cafe">{gatoId}</span>
                </h1>
                <p className="mt-1 text-sm text-marino/70">
                    Completa los siguientes pasos para evaluar la compatibilidad y bienestar del felino en tu hogar.
                </p>
            </div>

            {/* Stepper Visual */}
            <nav aria-label="Progreso de postulación" className="mb-8">
                <ol className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {PASOS.map((paso) => {
                        const Icon = paso.icono
                        const completado = pasoActual > paso.numero
                        const activo = pasoActual === paso.numero

                        return (
                            <li
                                key={paso.numero}
                                className={`flex items-center gap-3 rounded-2xl border p-3 transition ${activo
                                        ? 'border-marino bg-white shadow-sm ring-2 ring-celeste/60'
                                        : completado
                                            ? 'border-green-300 bg-green-50/60'
                                            : 'border-beige/60 bg-white/60 opacity-65'
                                    }`}
                            >
                                <div
                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${activo
                                            ? 'bg-marino text-crema'
                                            : completado
                                                ? 'bg-green-600 text-white'
                                                : 'bg-crema text-marino'
                                        }`}
                                >
                                    {completado ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-cafe">
                                        Paso {paso.numero}
                                    </p>
                                    <p className="truncate text-xs font-bold text-marino">{paso.titulo}</p>
                                </div>
                            </li>
                        )
                    })}
                </ol>
            </nav>

            {/* Contenedor Principal del Formulario */}
            <div className="rounded-3xl bg-white p-6 shadow-[0_14px_40px_rgba(23,38,65,0.06)] ring-1 ring-beige/70 sm:p-8">
                {/* Alerta de error del paso o backend */}
                {errorPaso && (
                    <div
                        role="alert"
                        className="mb-6 flex items-start gap-2.5 rounded-xl bg-red-50 p-4 text-sm font-medium text-red-900 ring-1 ring-red-200"
                    >
                        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
                        <span>{errorPaso}</span>
                    </div>
                )}

                {/* PASO 1: Datos del Postulante */}
                {pasoActual === 1 && (
                    <div className="space-y-5">
                        <div className="border-b border-beige/50 pb-3">
                            <h2 className="font-heading text-xl font-bold text-marino">
                                1. Datos del postulante
                            </h2>
                            <p className="text-xs text-marino/70">
                                Información básica de contacto y solvencia para los cuidados del gato.
                            </p>
                        </div>

                        <div className="grid gap-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="presupuestoMensual" className="block text-sm font-semibold text-marino mb-1.5">
                                    Presupuesto mensual destinado (Bs.) <span className="text-cafe">*</span>
                                </label>
                                <input
                                    id="presupuestoMensual"
                                    type="number"
                                    min="1"
                                    step="any"
                                    placeholder="Ej. 350"
                                    value={presupuestoMensual}
                                    onChange={(e) => setPresupuestoMensual(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-beige bg-white px-4 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                                />
                                <p className="mt-1 text-[11px] text-marino/60">
                                    Considera alimentación, arena sanitaria y controles veterinarios.
                                </p>
                            </div>

                            <div>
                                <label htmlFor="telefonoContacto" className="block text-sm font-semibold text-marino mb-1.5">
                                    Teléfono de contacto <span className="text-cafe">*</span>
                                </label>
                                <input
                                    id="telefonoContacto"
                                    type="tel"
                                    placeholder="Ej. 70012345"
                                    value={telefonoContacto}
                                    onChange={(e) => setTelefonoContacto(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-beige bg-white px-4 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="direccionDomicilio" className="block text-sm font-semibold text-marino mb-1.5">
                                Dirección del domicilio <span className="text-cafe">*</span>
                            </label>
                            <input
                                id="direccionDomicilio"
                                type="text"
                                placeholder="Zona, calle/avenida, número de casa o edificio"
                                value={direccionDomicilio}
                                onChange={(e) => setDireccionDomicilio(e.target.value)}
                                className="h-11 w-full rounded-xl border border-beige bg-white px-4 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                            />
                        </div>
                    </div>
                )}

                {/* PASO 2: Cuestionario de Vivienda y Tenencia Responsable */}
                {pasoActual === 2 && (
                    <div className="space-y-6">
                        <div className="border-b border-beige/50 pb-3">
                            <h2 className="font-heading text-xl font-bold text-marino">
                                2. Vivienda y tenencia responsable
                            </h2>
                            <p className="text-xs text-marino/70">
                                Evaluamos las condiciones de seguridad del hogar para prevenir accidentes.
                            </p>
                        </div>

                        {/* Preguntas obligatorias Sí/No */}
                        <div className="space-y-4">
                            <PreguntaSiNo
                                pregunta="¿La vivienda cuenta con mallas de protección en ventanas y balcones?"
                                valor={tieneMallasProteccion}
                                onChange={setTieneMallasProteccion}
                            />

                            <PreguntaSiNo
                                pregunta="¿Cuenta con permiso del propietario (o reglamento del edificio) para tener mascotas?"
                                valor={permisoPropietario}
                                onChange={setPermisoPropietario}
                            />

                            <PreguntaSiNo
                                pregunta="¿Se compromete a una tenencia responsable (esterilización, vacunas y no abandono)?"
                                valor={compromisoTenenciaResponsable}
                                onChange={setCompromisoTenenciaResponsable}
                            />
                        </div>

                        {/* Campos opcionales */}
                        <div className="grid gap-5 border-t border-beige/50 pt-5 sm:grid-cols-2">
                            <div>
                                <label htmlFor="otrosAnimalesEnCasa" className="block text-sm font-semibold text-marino mb-1.5">
                                    ¿Tiene otros animales en casa?{' '}
                                    <span className="text-xs font-normal text-marino/60">(opcional)</span>
                                </label>
                                <input
                                    id="otrosAnimalesEnCasa"
                                    type="text"
                                    placeholder="Ej. Sí, una gata esterilizada / No tengo"
                                    value={otrosAnimalesEnCasa}
                                    onChange={(e) => setOtrosAnimalesEnCasa(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-beige bg-white px-4 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                                />
                            </div>

                            <div>
                                <label htmlFor="tiempoSoloAlDiaHoras" className="block text-sm font-semibold text-marino mb-1.5">
                                    ¿Cuántas horas al día estaría solo el felino?{' '}
                                    <span className="text-xs font-normal text-marino/60">(opcional)</span>
                                </label>
                                <input
                                    id="tiempoSoloAlDiaHoras"
                                    type="number"
                                    min="0"
                                    max="24"
                                    placeholder="Ej. 4"
                                    value={tiempoSoloAlDiaHoras}
                                    onChange={(e) => setTiempoSoloAlDiaHoras(e.target.value)}
                                    className="h-11 w-full rounded-xl border border-beige bg-white px-4 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* PASO 3: Carga de Documentos */}
                {pasoActual === 3 && (
                    <div className="space-y-5">
                        <div className="border-b border-beige/50 pb-3">
                            <h2 className="font-heading text-xl font-bold text-marino">
                                3. Carga de documentos de respaldo
                            </h2>
                            <p className="text-xs text-marino/70">
                                Tus documentos serán cifrados de forma segura (AES-256) y utilizados únicamente para verificar tu solicitud.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <DocumentoDropzone
                                campo="carnetIdentidad"
                                titulo="Cédula de identidad"
                                descripcion="Anverso y reverso legible del documento de identidad vigente."
                                archivo={carnetIdentidad}
                                onSeleccionar={manejarSeleccionArchivo}
                            />

                            <DocumentoDropzone
                                campo="facturaServicio"
                                titulo="Comprobante de servicios básicos"
                                descripcion="Factura reciente de luz, agua o gas donde figure la dirección."
                                archivo={facturaServicio}
                                onSeleccionar={manejarSeleccionArchivo}
                            />

                            <DocumentoDropzone
                                campo="croquisDomicilio"
                                titulo="Croquis del domicilio"
                                descripcion="Mapa o esquema de ubicación de tu vivienda para la visita de seguimiento."
                                archivo={croquisDomicilio}
                                onSeleccionar={manejarSeleccionArchivo}
                            />
                        </div>
                    </div>
                )}

                {/* PASO 4: Revisión y Confirmación */}
                {pasoActual === 4 && (
                    <div className="space-y-6">
                        <div className="border-b border-beige/50 pb-3">
                            <h2 className="font-heading text-xl font-bold text-marino">
                                4. Revisión y confirmación
                            </h2>
                            <p className="text-xs text-marino/70">
                                Verifica que tus respuestas y documentos sean correctos antes de enviar. Una vez enviada, la solicitud no podrá editarse.
                            </p>
                        </div>

                        {/* Resumen Datos y Cuestionario */}
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl bg-crema/60 p-4 ring-1 ring-beige/70 space-y-2 text-sm">
                                <h3 className="font-heading text-sm font-bold text-cafe uppercase tracking-wide">
                                    Datos de contacto
                                </h3>
                                <p>
                                    <span className="text-marino/70">Presupuesto mensual:</span>{' '}
                                    <strong className="text-marino">Bs. {presupuestoMensual}</strong>
                                </p>
                                <p>
                                    <span className="text-marino/70">Teléfono:</span>{' '}
                                    <strong className="text-marino">{telefonoContacto}</strong>
                                </p>
                                <p>
                                    <span className="text-marino/70">Dirección:</span>{' '}
                                    <strong className="text-marino">{direccionDomicilio}</strong>
                                </p>
                            </div>

                            <div className="rounded-2xl bg-crema/60 p-4 ring-1 ring-beige/70 space-y-2 text-sm">
                                <h3 className="font-heading text-sm font-bold text-cafe uppercase tracking-wide">
                                    Hogar y tenencia
                                </h3>
                                <p>
                                    <span className="text-marino/70">Mallas de protección:</span>{' '}
                                    <strong className="text-marino">{tieneMallasProteccion ? 'Sí' : 'No'}</strong>
                                </p>
                                <p>
                                    <span className="text-marino/70">Permiso propietario:</span>{' '}
                                    <strong className="text-marino">{permisoPropietario ? 'Sí' : 'No'}</strong>
                                </p>
                                <p>
                                    <span className="text-marino/70">Compromiso tenencia:</span>{' '}
                                    <strong className="text-marino">
                                        {compromisoTenenciaResponsable ? 'Sí' : 'No'}
                                    </strong>
                                </p>
                                {otrosAnimalesEnCasa && (
                                    <p>
                                        <span className="text-marino/70">Otros animales:</span>{' '}
                                        <strong className="text-marino">{otrosAnimalesEnCasa}</strong>
                                    </p>
                                )}
                                {tiempoSoloAlDiaHoras !== '' && (
                                    <p>
                                        <span className="text-marino/70">Horas solo al día:</span>{' '}
                                        <strong className="text-marino">{tiempoSoloAlDiaHoras} hrs</strong>
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Resumen Documentos */}
                        <div className="rounded-2xl bg-crema/60 p-4 ring-1 ring-beige/70">
                            <h3 className="font-heading text-sm font-bold text-cafe uppercase tracking-wide mb-3">
                                Documentos adjuntos (3/3)
                            </h3>
                            <ul className="grid gap-2 text-xs sm:grid-cols-3">
                                <li className="rounded-xl bg-white p-3 ring-1 ring-beige/60">
                                    <p className="font-bold text-marino">Cédula de identidad</p>
                                    <p className="mt-0.5 truncate text-marino/70">{carnetIdentidad?.name}</p>
                                </li>
                                <li className="rounded-xl bg-white p-3 ring-1 ring-beige/60">
                                    <p className="font-bold text-marino">Factura de servicio</p>
                                    <p className="mt-0.5 truncate text-marino/70">{facturaServicio?.name}</p>
                                </li>
                                <li className="rounded-xl bg-white p-3 ring-1 ring-beige/60">
                                    <p className="font-bold text-marino">Croquis de domicilio</p>
                                    <p className="mt-0.5 truncate text-marino/70">{croquisDomicilio?.name}</p>
                                </li>
                            </ul>
                        </div>

                        <div className="flex items-center gap-2.5 rounded-xl bg-celeste/25 p-3.5 text-xs font-medium text-marino">
                            <ShieldCheck className="h-5 w-5 shrink-0 text-marino" />
                            <span>
                                Al confirmar, aceptas que tus datos y documentos sean revisados por el equipo de Proyecto Teo.
                            </span>
                        </div>
                    </div>
                )}

                {/* Botones de Navegación del Stepper */}
                <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-beige/50 pt-5">
                    {pasoActual > 1 ? (
                        <button
                            type="button"
                            disabled={enviando}
                            onClick={retrocederPaso}
                            className="inline-flex items-center gap-2 rounded-xl border border-beige bg-white px-5 py-2.5 text-sm font-semibold text-marino transition hover:bg-crema disabled:opacity-50 cursor-pointer"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span>Anterior</span>
                        </button>
                    ) : (
                        <div />
                    )}

                    {pasoActual < 4 ? (
                        <button
                            type="button"
                            onClick={avanzarPaso}
                            className="inline-flex items-center gap-2 rounded-xl bg-marino px-6 py-2.5 text-sm font-semibold text-crema transition hover:bg-marino/90 cursor-pointer"
                        >
                            <span>Siguiente</span>
                            <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={enviando}
                            onClick={manejarEnvioFinal}
                            className="inline-flex items-center gap-2 rounded-xl bg-marino px-6 py-3 text-sm font-semibold text-crema shadow-sm transition hover:bg-marino/90 disabled:opacity-70 cursor-pointer"
                        >
                            <Send className="h-4 w-4" />
                            <span>{enviando ? estadoProceso || 'Enviando...' : 'Confirmar y enviar postulación'}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    )
}

function PreguntaSiNo({
    pregunta,
    valor,
    onChange,
}: {
    pregunta: string
    valor: boolean | null
    onChange: (nuevoValor: boolean) => void
}) {
    return (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-beige/80 bg-crema/40 p-4 sm:flex-row sm:items-center">
            <p className="text-sm font-semibold text-marino">
                {pregunta} <span className="text-cafe">*</span>
            </p>

            <div className="flex shrink-0 gap-2">
                <button
                    type="button"
                    onClick={() => onChange(true)}
                    className={`rounded-xl px-5 py-2 text-xs font-bold transition cursor-pointer ${valor === true
                            ? 'bg-marino text-crema shadow-xs'
                            : 'bg-white text-marino ring-1 ring-beige hover:bg-celeste/25'
                        }`}
                >
                    Sí
                </button>
                <button
                    type="button"
                    onClick={() => onChange(false)}
                    className={`rounded-xl px-5 py-2 text-xs font-bold transition cursor-pointer ${valor === false
                            ? 'bg-cafe text-crema shadow-xs'
                            : 'bg-white text-marino ring-1 ring-beige hover:bg-celeste/25'
                        }`}
                >
                    No
                </button>
            </div>
        </div>
    )
}