import { useEffect, useState, type SubmitEvent } from 'react'
import { Link } from 'react-router'
import GatoCard, { type EstadoGato } from '../../components/GatoCard'
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
    fechaDerivacion: string
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
    'w-full rounded-xl border border-[#172641]/50 bg-white px-4 font-sans text-base text-[#172641] placeholder:text-[#172641]/65 outline-none transition focus-visible:border-[#172641] focus-visible:ring-2 focus-visible:ring-[#A9D6E8] disabled:cursor-not-allowed disabled:bg-[#FAF7F0] aria-[invalid=true]:border-red-700 aria-[invalid=true]:focus-visible:ring-red-200'

const CLASE_TARJETA =
    'rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-[#D9C3A5]/70 sm:p-6'

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

function construirPayload(v: Valores, via: ViaProcedencia): CreateIngresoPayload {
    const payload: CreateIngresoPayload = { gatoId: v.gatoId, viaProcedencia: via }
    if (via === 'FUNDACION') {
        payload.nombreInstitucion = v.nombreInstitucion.trim()
        payload.fechaDerivacion = v.fechaDerivacion
    }
    if (v.observaciones.trim()) payload.observaciones = v.observaciones.trim()
    return payload
}

export default function RegistrarIngreso() {
    const [valores, setValores] = useState<Valores>(VALORES_INICIALES)
    const [errores, setErrores] = useState<Errores>({})
    const [enviando, setEnviando] = useState(false)
    const [notificacion, setNotificacion] = useState<Notificacion | null>(null)
    const [gatos, setGatos] = useState<GatoOpcion[]>([])
    const [estadoGatos, setEstadoGatos] = useState<EstadoGatos>('cargando')

    const esFundacion = valores.viaProcedencia === 'FUNDACION'

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

    function actualizar(campo: NombreCampo, valor: string) {
        const siguiente = { ...valores, [campo]: valor } as Valores
        setValores(siguiente)
        setNotificacion(null)

        if (campo === 'viaProcedencia') {
            setErrores((prev) => ({
                ...prev,
                viaProcedencia: undefined,
                ...(valor !== 'FUNDACION' ? { nombreInstitucion: undefined, fechaDerivacion: undefined } : {}),
            }))
            return
        }

        if (errores[campo]) {
            setErrores((prev) => ({ ...prev, [campo]: undefined }))
        }
    }

    async function manejarEnvio(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        if (enviando) return

        setNotificacion(null)
        const nuevosErrores = validarTodo(valores)

        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores)
            setNotificacion({ tipo: 'error', mensaje: 'Corrige los errores del formulario para continuar.' })
            return
        }

        const via = valores.viaProcedencia
        if (!via) return

        setEnviando(true)
        try {
            await enviarIngreso(construirPayload(valores, via))
            setNotificacion({ tipo: 'exito', mensaje: MENSAJE_EXITO })
            setValores(VALORES_INICIALES)
            setErrores({})
        } catch (err) {
            setNotificacion({
                tipo: 'error',
                mensaje: err instanceof Error ? err.message : 'Error al registrar el ingreso.',
            })
        } finally {
            setEnviando(false)
        }
    }

    // Obtener el objeto del gato seleccionado para previsualización
    const gatoSeleccionado = gatos.find((g) => g.id === valores.gatoId)

    return (
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
            <header>
                <h1 className="font-heading text-2xl font-semibold text-marino sm:text-3xl">Registrar ingreso</h1>
                <p className="mt-1 text-sm text-marino/70 sm:text-base">
                    Anota la procedencia y detalles de llegada de un felino dado de alta.
                </p>
            </header>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Formulario */}
                <form onSubmit={manejarEnvio} noValidate className="space-y-6 lg:col-span-7">
                    <section className={CLASE_TARJETA}>
                        <h2 className="font-heading text-lg font-semibold text-marino">
                            1. Felino que ingresa
                        </h2>

                        <div className="mt-4">
                            <label htmlFor="gatoId" className="block text-sm font-semibold text-marino mb-1.5">
                                Gato <span className="text-cafe">*</span>
                            </label>
                            <select
                                id="gatoId"
                                disabled={estadoGatos !== 'listo' || gatos.length === 0}
                                value={valores.gatoId}
                                onChange={(e) => actualizar('gatoId', e.target.value)}
                                className={`${CLASE_CONTROL} h-12`}
                            >
                                <option value="">
                                    {estadoGatos === 'cargando'
                                        ? 'Cargando gatos…'
                                        : gatos.length === 0
                                            ? 'Aún no hay gatos dados de alta'
                                            : 'Selecciona un gato'}
                                </option>
                                {gatos.map((gato) => (
                                    <option key={gato.id} value={gato.id}>
                                        {gato.codigo} · {gato.nombre}
                                    </option>
                                ))}
                            </select>
                            {errores.gatoId && <p className="mt-1 text-xs text-red-600 font-medium">{errores.gatoId}</p>}

                            <p className="mt-2 text-xs text-marino/70">
                                ¿No está registrado?{' '}
                                <Link to="/admin/felinos" className="font-semibold underline text-marino">
                                    Primero da de alta al felino
                                </Link>
                                .
                            </p>
                        </div>
                    </section>

                    <section className={CLASE_TARJETA}>
                        <h2 className="font-heading text-lg font-semibold text-marino">
                            2. Procedencia
                        </h2>

                        <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            {OPCIONES_PROCEDENCIA.map((opcion) => (
                                <label
                                    key={opcion.valor}
                                    className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3.5 transition ${valores.viaProcedencia === opcion.valor
                                            ? 'border-marino bg-celeste/30 ring-2 ring-marino'
                                            : 'border-marino/30 bg-white hover:bg-crema'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="viaProcedencia"
                                        value={opcion.valor}
                                        checked={valores.viaProcedencia === opcion.valor}
                                        onChange={() => actualizar('viaProcedencia', opcion.valor)}
                                        className="sr-only"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-marino">{opcion.etiqueta}</p>
                                        <p className="text-xs text-marino/70">{opcion.descripcion}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {errores.viaProcedencia && (
                            <p className="mt-2 text-xs text-red-600 font-medium">{errores.viaProcedencia}</p>
                        )}

                        {esFundacion && (
                            <div className="mt-4 grid gap-4 rounded-xl bg-crema p-4 ring-1 ring-[#D9C3A5]/70 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="nombreInstitucion" className="block text-xs font-semibold text-marino mb-1">
                                        Institución *
                                    </label>
                                    <input
                                        id="nombreInstitucion"
                                        type="text"
                                        placeholder="Nombre de la fundación"
                                        value={valores.nombreInstitucion}
                                        onChange={(e) => actualizar('nombreInstitucion', e.target.value)}
                                        className={`${CLASE_CONTROL} h-10 text-sm`}
                                    />
                                    {errores.nombreInstitucion && (
                                        <p className="mt-1 text-xs text-red-600 font-medium">{errores.nombreInstitucion}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="fechaDerivacion" className="block text-xs font-semibold text-marino mb-1">
                                        Fecha de derivación *
                                    </label>
                                    <input
                                        id="fechaDerivacion"
                                        type="date"
                                        max={hoyLocal()}
                                        value={valores.fechaDerivacion}
                                        onChange={(e) => actualizar('fechaDerivacion', e.target.value)}
                                        className={`${CLASE_CONTROL} h-10 text-sm`}
                                    />
                                    {errores.fechaDerivacion && (
                                        <p className="mt-1 text-xs text-red-600 font-medium">{errores.fechaDerivacion}</p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="mt-4">
                            <label htmlFor="observaciones" className="block text-sm font-semibold text-marino mb-1.5">
                                Observaciones
                            </label>
                            <textarea
                                id="observaciones"
                                rows={3}
                                placeholder="Detalles sobre el hallazgo, rescatista o condición inicial..."
                                value={valores.observaciones}
                                onChange={(e) => actualizar('observaciones', e.target.value)}
                                className={`${CLASE_CONTROL} py-2.5 text-sm`}
                            />
                        </div>
                    </section>

                    {notificacion && (
                        <div
                            className={`rounded-xl p-4 text-sm font-medium ${notificacion.tipo === 'exito'
                                    ? 'bg-green-50 text-green-900 ring-1 ring-green-600/30'
                                    : 'bg-red-50 text-red-900 ring-1 ring-red-600/30'
                                }`}
                        >
                            {notificacion.mensaje}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={enviando}
                        className="w-full rounded-xl bg-marino py-3 text-sm font-semibold text-crema transition hover:bg-marino/90 disabled:opacity-70"
                    >
                        {enviando ? 'Guardando...' : 'Registrar ingreso'}
                    </button>
                </form>

                {/* Tarjeta Visual del Gato Seleccionado */}
                <aside className="lg:col-span-5">
                    <div className="sticky top-6">
                        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-cafe">
                            Felino Seleccionado
                        </h2>
                        {gatoSeleccionado ? (
                            <GatoCard
                                codigoFelino={gatoSeleccionado.codigo}
                                nombre={gatoSeleccionado.nombre}
                                peso={3.5} // Valores o extensiones de API opcionales
                                edadMeses={12}
                                estado={'CUARENTENA' as EstadoGato}
                                modoPublico={false}
                            />
                        ) : (
                            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-beige bg-crema p-6 text-center text-marino/50">
                                <svg className="h-10 w-10 mb-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="9" />
                                    <path d="M12 8v4M12 16v.01" />
                                </svg>
                                <p className="text-sm font-medium">Selecciona un gato de la lista para ver su ficha técnica.</p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>
        </div>
    )
}