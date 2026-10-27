import { useEffect, useId, useRef, useState, type ReactNode, type SubmitEvent } from 'react'
import { Link } from 'react-router'
import {
    MODO_DEMOSTRACION,
    enviarIngreso,
    obtenerGatosParaIngreso,
    type CreateIngresoPayload,
    type GatoOpcion,
    type ViaProcedencia,
} from '../../services/ingresosService'

type Valores = {
    gatoId: string
    viaProcedencia: ViaProcedencia | ''
    nombreInstitucion: string
    fechaDerivacion: string // YYYY-MM-DD
    observaciones: string
}
type NombreCampo = keyof Valores
type Errores = Partial<Record<NombreCampo, string>>
type Notificacion = { tipo: 'exito' | 'error'; mensaje: string }
type EstadoGatos = 'cargando' | 'listo' | 'error'

const VALORES_INICIALES: Valores = {
    gatoId: '',
    viaProcedencia: '',
    nombreInstitucion: '',
    fechaDerivacion: '',
    observaciones: '',
}

const ORDEN_CAMPOS: NombreCampo[] = [
    'gatoId',
    'viaProcedencia',
    'nombreInstitucion',
    'fechaDerivacion',
    'observaciones',
]

const ETIQUETA_CAMPO: Record<NombreCampo, string> = {
    gatoId: 'Gato',
    viaProcedencia: 'Vía de procedencia',
    nombreInstitucion: 'Nombre de la institución',
    fechaDerivacion: 'Fecha de derivación',
    observaciones: 'Observaciones',
}

const MAX = { nombreInstitucion: 150, observaciones: 500 }

const OPCIONES_PROCEDENCIA: { valor: ViaProcedencia; etiqueta: string; descripcion: string }[] = [
    { valor: 'RESCATADO', etiqueta: 'Rescatado', descripcion: 'Rescatado de la calle por el equipo o tras un aviso.' },
    { valor: 'FUNDACION', etiqueta: 'Fundación', descripcion: 'Derivado por una fundación aliada.' },
    { valor: 'PARTICULAR', etiqueta: 'Particular', descripcion: 'Lo trae una persona que ya no puede cuidarlo.' },
]

const MENSAJE_EXITO = MODO_DEMOSTRACION
    ? 'Simulación completada: el formulario es válido. Estás en modo de demostración, así que no se guardó ningún ingreso.'
    : 'Ingreso registrado correctamente.'

const CLASE_CONTROL =
    'w-full rounded-xl border border-marino/50 bg-white px-4 font-sans text-base text-marino placeholder:text-marino/65 outline-none transition focus-visible:border-marino focus-visible:ring-2 focus-visible:ring-celeste disabled:cursor-not-allowed disabled:bg-crema aria-[invalid=true]:border-red-700 aria-[invalid=true]:focus-visible:ring-red-200'

const CLASE_TARJETA =
    'rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-beige/70 sm:p-6'

/* ───────────── Validaciones locales ───────────── */

function hoyLocal() {
    const ahora = new Date()
    const mes = String(ahora.getMonth() + 1).padStart(2, '0')
    const dia = String(ahora.getDate()).padStart(2, '0')
    return `${ahora.getFullYear()}-${mes}-${dia}`
}

function esFechaReal(valor: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false
    const [anio, mes, dia] = valor.split('-').map(Number)
    const fecha = new Date(anio, mes - 1, dia)
    return fecha.getFullYear() === anio && fecha.getMonth() === mes - 1 && fecha.getDate() === dia
}

function validarCampo(campo: NombreCampo, v: Valores): string | undefined {
    const esFundacion = v.viaProcedencia === 'FUNDACION'

    switch (campo) {
        case 'gatoId':
            return v.gatoId ? undefined : 'Selecciona el gato que ingresa.'

        case 'viaProcedencia':
            return v.viaProcedencia ? undefined : 'Selecciona la vía de procedencia.'

        case 'nombreInstitucion': {
            if (!esFundacion) return undefined
            const texto = v.nombreInstitucion.trim()
            if (!texto) return 'Escribe el nombre de la fundación.'
            if (texto.length > MAX.nombreInstitucion) return `El nombre no puede superar ${MAX.nombreInstitucion} caracteres.`
            return undefined
        }

        case 'fechaDerivacion': {
            if (!esFundacion) return undefined
            if (!v.fechaDerivacion) return 'Elige la fecha de derivación.'
            if (!esFechaReal(v.fechaDerivacion)) return 'Usa una fecha válida (AAAA-MM-DD).'
            if (v.fechaDerivacion > hoyLocal()) return 'La fecha de derivación no puede ser posterior a hoy.'
            return undefined
        }

        case 'observaciones':
            return v.observaciones.trim().length > MAX.observaciones
                ? `Las observaciones no pueden superar ${MAX.observaciones} caracteres.`
                : undefined
    }
}

function validarTodo(v: Valores): Errores {
    const errores: Errores = {}
    for (const campo of ORDEN_CAMPOS) {
        const mensaje = validarCampo(campo, v)
        if (mensaje) errores[campo] = mensaje
    }
    return errores
}

function listar(nombres: string[]) {
    if (nombres.length <= 1) return nombres.join('')
    return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`
}

// Mensaje general errores
function resumenDeErrores(errores: Errores, v: Valores): string {
    const conError = ORDEN_CAMPOS.filter((campo) => errores[campo])
    const faltantes = conError.filter((campo) => campo !== 'observaciones' && v[campo].trim() === '')
    const porRevisar = conError.filter((campo) => !faltantes.includes(campo))

    const partes: string[] = []
    if (faltantes.length > 0) {
        partes.push(`Faltan campos obligatorios: ${listar(faltantes.map((c) => ETIQUETA_CAMPO[c]))}.`)
    }
    if (porRevisar.length > 0) {
        partes.push(`Revisa: ${listar(porRevisar.map((c) => ETIQUETA_CAMPO[c]))}.`)
    }
    return partes.join(' ')
}

// Arma el cuerpo del POST
function construirPayload(v: Valores, via: ViaProcedencia): CreateIngresoPayload {
    const payload: CreateIngresoPayload = { gatoId: v.gatoId, viaProcedencia: via }
    if (via === 'FUNDACION') {
        payload.nombreInstitucion = v.nombreInstitucion.trim()
        payload.fechaDerivacion = v.fechaDerivacion
    }
    if (v.observaciones.trim()) payload.observaciones = v.observaciones.trim()
    return payload
}

// ───────────── Piezas de interfaz ─────────────

type IconoProps = { className?: string }

function IconoAlerta({ className = 'h-4 w-4' }: IconoProps) {
    return (
        <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5.5M12 16.5v.01" />
        </svg>
    )
}

function IconoExito({ className = 'h-5 w-5' }: IconoProps) {
    return (
        <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12.5 2.8 2.8L16 9.5" />
        </svg>
    )
}

function IconoInfo({ className = 'h-5 w-5' }: IconoProps) {
    return (
        <svg className={`${className} shrink-0`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8v.01" />
        </svg>
    )
}

function IconoCerrar() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  )
}

function Spinner() {
    return (
        <svg className="h-5 w-5 motion-safe:animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
        </svg>
    )
}

type AtributosCampo = {
    id: string
    'aria-describedby'?: string
    'aria-invalid'?: boolean
    'aria-required'?: boolean
}

function Campo({
    etiqueta,
    obligatorio,
    ayuda,
    error,
    className = '',
    children,
}: {
    etiqueta: string
    obligatorio?: boolean
    ayuda?: ReactNode
    error?: string
    className?: string
    children: (atributos: AtributosCampo) => ReactNode
}) {
    const id = useId()
    const ayudaId = `${id}-ayuda`
    const errorId = `${id}-error`
    const describedBy = [ayuda ? ayudaId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined

    return (
        <div className={`flex flex-col gap-1.5 ${className}`}>
        <label htmlFor={id} className="font-sans text-sm font-semibold text-marino">
            {etiqueta}
            {obligatorio ? (
            <span className="ml-1 text-cafe" aria-hidden="true">
                *
            </span>
            ) : null}
        </label>
        {children({
            id,
            'aria-describedby': describedBy,
            'aria-invalid': error ? true : undefined,
            'aria-required': obligatorio || undefined,
        })}
        {ayuda ? (
            <p id={ayudaId} className="font-sans text-xs text-marino/70">
            {ayuda}
            </p>
        ) : null}
        {error ? (
            <p id={errorId} className="flex items-start gap-1.5 font-sans text-sm font-medium text-red-700">
            <IconoAlerta className="mt-0.5 h-4 w-4" />
            <span>{error}</span>
            </p>
        ) : null}
        </div>
    )
}

function AvisoNotificacion({ tipo, mensaje, onCerrar }: Notificacion & { onCerrar: () => void }) {
    const estilo =
        tipo === 'exito'
            ? 'bg-green-50 text-green-900 ring-green-700/40'
            : 'bg-red-50 text-red-900 ring-red-700/40'

    return (
        <div className={`mt-6 flex items-start gap-3 rounded-xl p-4 ring-1 ${estilo}`}>
            {tipo === 'exito' ? <IconoExito className="mt-0.5 h-5 w-5" /> : <IconoAlerta className="mt-0.5 h-5 w-5" />}
            <p className="flex-1 font-sans text-sm font-medium">{mensaje}</p>
            <button
                type="button"
                onClick={onCerrar}
                aria-label="Cerrar notificación"
                className="-m-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-marino focus-visible:outline-none"
            >
                <IconoCerrar />
            </button>
        </div>
    )
}

// ───────────── Pantalla ─────────────

export default function RegistrarIngreso() {
    const [valores, setValores] = useState<Valores>(VALORES_INICIALES)
    const [errores, setErrores] = useState<Errores>({})
    const [tocados, setTocados] = useState<Partial<Record<NombreCampo, boolean>>>({})
    const [intentoEnvio, setIntentoEnvio] = useState(false)
    const [enviando, setEnviando] = useState(false)
    const [notificacion, setNotificacion] = useState<Notificacion | null>(null)
    const [gatos, setGatos] = useState<GatoOpcion[]>([])
    const [estadoGatos, setEstadoGatos] = useState<EstadoGatos>('cargando')

    const refs = useRef<Partial<Record<NombreCampo, HTMLElement | null>>>({})
    const botonRef = useRef<HTMLButtonElement>(null)
    const devolverFoco = useRef(false)

    const esFundacion = valores.viaProcedencia === 'FUNDACION'

  // Carga la lista de gatos para el selector.
    useEffect(() => {
        let activo = true
        obtenerGatosParaIngreso()
        .then((lista) => {
            if (!activo) return
            setGatos(lista)
            setEstadoGatos('listo')
        })
        .catch(() => {
            if (activo) setEstadoGatos('error')
        })
        return () => {
        activo = false
        }
    }, [])


    useEffect(() => {
        if (!enviando && devolverFoco.current) {
        devolverFoco.current = false
        botonRef.current?.focus()
        }
    }, [enviando])

    function registrarRef(campo: NombreCampo) {
        return (elemento: HTMLElement | null) => {
        refs.current[campo] = elemento
        }
    }

    function actualizar(campo: NombreCampo, valor: string) {
        const siguiente = { ...valores, [campo]: valor } as Valores
        setValores(siguiente)
        setNotificacion(null)

        if (campo === 'viaProcedencia') {
        setErrores((previos) => ({
            ...previos,
            viaProcedencia: undefined,
            ...(valor !== 'FUNDACION' ? { nombreInstitucion: undefined, fechaDerivacion: undefined } : {}),
        }))
        return
        }

        if (tocados[campo] || intentoEnvio) {
        setErrores((previos) => ({ ...previos, [campo]: validarCampo(campo, siguiente) }))
        }
    }

    function alSalir(campo: NombreCampo) {
        setTocados((previos) => ({ ...previos, [campo]: true }))
        setErrores((previos) => ({ ...previos, [campo]: validarCampo(campo, valores) }))
    }

    async function manejarEnvio(evento: SubmitEvent<HTMLFormElement>) {
        evento.preventDefault()
        if (enviando) return

        setNotificacion(null)
        setIntentoEnvio(true)

        const nuevosErrores = validarTodo(valores)
        setErrores(nuevosErrores)

        // Si falta algo: se avisa qué campos son y el foco va al primero con error.
        const primerError = ORDEN_CAMPOS.find((campo) => nuevosErrores[campo])
        if (primerError) {
            setNotificacion({ tipo: 'error', mensaje: resumenDeErrores(nuevosErrores, valores) })
            refs.current[primerError]?.focus()
            return
        }

        const via = valores.viaProcedencia
        if (via === '') return // inalcanzable: la validación ya exige la vía

        devolverFoco.current = true
        setEnviando(true)
        try {
            await enviarIngreso(construirPayload(valores, via))
            setNotificacion({ tipo: 'exito', mensaje: MENSAJE_EXITO })
            setValores(VALORES_INICIALES)
            setErrores({})
            setTocados({})
            setIntentoEnvio(false)
        } catch (error) {
            setNotificacion({
                tipo: 'error',
                mensaje:
                error instanceof Error && error.message
                    ? error.message
                    : 'No se pudo registrar el ingreso. Inténtalo de nuevo.',
        })
        } finally {
        setEnviando(false)
        }
    }

    const sinGatos = estadoGatos === 'listo' && gatos.length === 0

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
            <header>
                <h1 className="font-heading text-2xl font-semibold text-marino sm:text-3xl">Registrar ingreso</h1>
                <p className="mt-2 max-w-2xl font-sans text-sm text-marino/70 sm:text-base">
                    Anota cómo y cuándo llegó un gato que ya está dado de alta. Los campos con{' '}
                    <span className="font-semibold text-cafe" aria-hidden="true">
                        *
                    </span>
                    <span className="sr-only">asterisco</span> son obligatorios.
                </p>
            </header>

            {MODO_DEMOSTRACION ? (
                <aside
                    aria-labelledby="demo-titulo"
                    className="flex items-start gap-3 rounded-2xl bg-celeste/30 p-4 ring-1 ring-celeste"
                >
                    <IconoInfo className="mt-0.5 h-5 w-5 text-marino" />
                    <div>
                        <p id="demo-titulo" className="font-sans text-sm font-bold text-marino">
                            Modo de demostración
                        </p>
                        <p className="font-sans text-sm text-marino/80">
                            Este formulario aún no está conectado al servidor: los gatos de la lista son de ejemplo y al enviarlo no
                            se guarda ningún ingreso.
                        </p>
                    </div>
                </aside>
            ) : null}

            <form className="flex flex-col" onSubmit={manejarEnvio} noValidate aria-busy={enviando}>
                {/* Mientras se envia todos los controles quedan deshabilitados. */}
                <fieldset disabled={enviando} className="m-0 flex min-w-0 flex-col gap-6 border-0 p-0">
                    <section aria-labelledby="gato-titulo" className={CLASE_TARJETA}>
                        <h2 id="gato-titulo" className="font-heading text-lg font-semibold text-marino">
                            Felino que ingresa
                        </h2>

                        <div className="mt-4">
                            <Campo
                                etiqueta="Gato"
                                obligatorio
                                error={errores.gatoId}
                                ayuda={
                                    estadoGatos === 'error' ? (
                                        'No se pudo cargar la lista de gatos. Recarga la página para intentarlo de nuevo.'
                                    ) : (
                                        <>
                                            ¿No aparece en la lista?{' '}
                                            <Link
                                                to="/admin/felinos"
                                                className="rounded font-semibold text-marino underline underline-offset-2 focus-visible:ring-2 focus-visible:ring-marino focus-visible:outline-none"
                                            >
                                                Primero da de alta al felino
                                            </Link>
                                            .
                                        </>
                                    )
                                }
                            >
                                {(atributos) => (
                                    <select
                                        {...atributos}
                                        ref={registrarRef('gatoId')}
                                        disabled={estadoGatos !== 'listo' || sinGatos}
                                        value={valores.gatoId}
                                        onChange={(evento) => actualizar('gatoId', evento.target.value)}
                                        onBlur={() => alSalir('gatoId')}
                                        className={`${CLASE_CONTROL} h-12`}
                                    >
                                        <option value="">
                                            {estadoGatos === 'cargando'
                                                ? 'Cargando gatos…'
                                                : sinGatos
                                                    ? 'Aún no hay gatos dados de alta'
                                                    : 'Selecciona un gato'}
                                        </option>
                                        {gatos.map((gato) => (
                                            <option key={gato.id} value={gato.id}>
                                                {gato.codigo} · {gato.nombre}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </Campo>
                        </div>
                    </section>

                    <section aria-labelledby="origen-titulo" className={CLASE_TARJETA}>
                        <h2 id="origen-titulo" className="font-heading text-lg font-semibold text-marino">
                            Origen del ingreso
                        </h2>

                        <fieldset
                            className="m-0 mt-4 min-w-0 border-0 p-0"
                            aria-describedby={errores.viaProcedencia ? 'via-error' : undefined}
                        >
                            <legend className="font-sans text-sm font-semibold text-marino">
                                Vía de procedencia
                                <span className="ml-1 text-cafe" aria-hidden="true">
                                    *
                                </span>
                                <span className="sr-only"> (obligatorio)</span>
                            </legend>

                            <div className="mt-2 grid gap-3 sm:grid-cols-3">
                                {OPCIONES_PROCEDENCIA.map((opcion, indice) => (
                                    <label
                                        key={opcion.valor}
                                        className="group flex cursor-pointer items-start gap-3 rounded-xl border border-marino/50 bg-white p-4 transition hover:bg-crema has-checked:border-marino has-checked:bg-celeste/30 has-checked:ring-2 has-checked:ring-marino has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-marino"
                                    >
                                        <input
                                            ref={indice === 0 ? registrarRef('viaProcedencia') : undefined}
                                            type="radio"
                                            name="viaProcedencia"
                                            value={opcion.valor}
                                            checked={valores.viaProcedencia === opcion.valor}
                                            onChange={() => actualizar('viaProcedencia', opcion.valor)}
                                            className="sr-only"
                                        />
                                        <span
                                            aria-hidden="true"
                                            className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 border-marino/60 group-has-checked:border-marino"
                                        >
                                            <span className="h-2.5 w-2.5 rounded-full bg-marino opacity-0 group-has-checked:opacity-100" />
                                        </span>
                                        <span className="flex flex-col gap-0.5">
                                            <span className="font-sans text-sm font-semibold text-marino">{opcion.etiqueta}</span>
                                            <span className="font-sans text-xs text-marino/70">{opcion.descripcion}</span>
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {errores.viaProcedencia ? (
                                <p id="via-error" className="mt-2 flex items-start gap-1.5 font-sans text-sm font-medium text-red-700">
                                    <IconoAlerta className="mt-0.5 h-4 w-4" />
                                    <span>{errores.viaProcedencia}</span>
                                </p>
                            ) : null}
                        </fieldset>

                        {esFundacion ? (
                            <div className="mt-5 grid gap-5 rounded-xl bg-crema p-4 ring-1 ring-beige/70 sm:grid-cols-2">
                                <Campo etiqueta="Nombre de la institución" obligatorio error={errores.nombreInstitucion}>
                                    {(atributos) => (
                                        <input
                                            {...atributos}
                                            ref={registrarRef('nombreInstitucion')}
                                            type="text"
                                            autoComplete="off"
                                            maxLength={MAX.nombreInstitucion}
                                            placeholder="Nombre de la fundación"
                                            value={valores.nombreInstitucion}
                                            onChange={(evento) => actualizar('nombreInstitucion', evento.target.value)}
                                            onBlur={() => alSalir('nombreInstitucion')}
                                            className={`${CLASE_CONTROL} h-12`}
                                        />
                                    )}
                                </Campo>

                                <Campo etiqueta="Fecha de derivación" obligatorio error={errores.fechaDerivacion}>
                                    {(atributos) => (
                                        <input
                                            {...atributos}
                                            ref={registrarRef('fechaDerivacion')}
                                            type="date"
                                            max={hoyLocal()}
                                            value={valores.fechaDerivacion}
                                            onChange={(evento) => actualizar('fechaDerivacion', evento.target.value)}
                                            onBlur={() => alSalir('fechaDerivacion')}
                                            className={`${CLASE_CONTROL} h-12`}
                                        />
                                    )}
                                </Campo>
                            </div>
                        ) : null}

                        <div className="mt-5">
                            <Campo etiqueta="Observaciones" error={errores.observaciones}>
                                {(atributos) => (
                                    <>
                                        <textarea
                                            {...atributos}
                                            ref={registrarRef('observaciones')}
                                            rows={4}
                                            maxLength={MAX.observaciones}
                                            placeholder="Cómo fue rescatado, estado al llegar, quién lo trajo…"
                                            value={valores.observaciones}
                                            onChange={(evento) => actualizar('observaciones', evento.target.value)}
                                            onBlur={() => alSalir('observaciones')}
                                            className={`${CLASE_CONTROL} min-h-28 resize-y py-3`}
                                        />
                                        <p className="text-right font-sans text-xs text-marino/70">
                                            {valores.observaciones.length}/{MAX.observaciones}
                                        </p>
                                    </>
                                )}
                            </Campo>
                        </div>
                    </section>
                </fieldset>

                <div aria-live="polite" aria-atomic="true">
                    {notificacion?.tipo === 'exito' ? (
                        <AvisoNotificacion {...notificacion} onCerrar={() => setNotificacion(null)} />
                    ) : null}
                </div>
                <div role="alert">
                    {notificacion?.tipo === 'error' ? (
                        <AvisoNotificacion {...notificacion} onCerrar={() => setNotificacion(null)} />
                    ) : null}
                </div>

                <div className="mt-6 flex sm:justify-end">
                    <button
                        ref={botonRef}
                        type="submit"
                        disabled={enviando}
                        className="inline-flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl bg-marino px-8 font-sans text-base font-semibold text-crema transition hover:bg-marino/90 focus-visible:ring-2 focus-visible:ring-marino focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-80 sm:w-auto"
                    >
                        {enviando ? <Spinner /> : null}
                        {enviando ? 'Registrando…' : 'Registrar ingreso'}
                    </button>
                </div>
            </form>
        </div>
    )
}