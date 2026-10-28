import { useState, useId, useRef, type SubmitEvent, type ReactNode } from 'react'
import GatoCard, { type EstadoGato, type SexoGato } from '../../components/GatoCard'

type TallaFelino = 'Pequeño' | 'Mediano' | 'Grande'

interface ValoresFormulario {
    codigoFelino: string
    nombre: string
    peso: string
    talla: TallaFelino | ''
    edadMeses: string
    temperamento: string
    colorPelaje: string
    sexo: SexoGato | ''
    estado: EstadoGato
    fotoUrl: string
    historia: string
}

type ErroresFormulario = Partial<Record<keyof ValoresFormulario, string>>
type Notificacion = { tipo: 'exito' | 'error'; mensaje: string }

const VALORES_INICIALES: ValoresFormulario = {
    codigoFelino: '',
    nombre: '',
    peso: '',
    talla: '',
    edadMeses: '',
    temperamento: '',
    colorPelaje: '',
    sexo: '',
    estado: 'CUARENTENA',
    fotoUrl: '',
    historia: '',
}

export default function AltaFelino() {
    const [valores, setValores] = useState<ValoresFormulario>(VALORES_INICIALES)
    const [errores, setErrores] = useState<ErroresFormulario>({})
    const [enviando, setEnviando] = useState(false)
    const [notificacion, setNotificacion] = useState<Notificacion | null>(null)

    const botonRef = useRef<HTMLButtonElement>(null)

    // Generador sugerido de código único
    function generarCodigo() {
        const num = Math.floor(100 + Math.random() * 900)
        setValores((prev) => ({ ...prev, codigoFelino: `CAT-TEO-${num}` }))
        setErrores((prev) => ({ ...prev, codigoFelino: undefined }))
    }

    function validar(v: ValoresFormulario): ErroresFormulario {
        const err: ErroresFormulario = {}

        if (!v.codigoFelino.trim()) err.codigoFelino = 'El código único es obligatorio.'
        if (!v.nombre.trim()) err.nombre = 'El nombre del felino es obligatorio.'

        const pesoNum = parseFloat(v.peso)
        if (!v.peso) {
            err.peso = 'El peso es obligatorio.'
        } else if (isNaN(pesoNum) || pesoNum <= 0) {
            err.peso = 'El peso debe ser un número mayor a 0 kg.'
        }

        const edadNum = parseInt(v.edadMeses, 10)
        if (!v.edadMeses) {
            err.edadMeses = 'La edad estimada es obligatoria.'
        } else if (isNaN(edadNum) || edadNum <= 0) {
            err.edadMeses = 'La edad debe ser mayor a 0 meses.'
        }

        if (!v.sexo) err.sexo = 'Selecciona el sexo del felino.'

        if (v.fotoUrl && !/^https?:\/\/.+/i.test(v.fotoUrl)) {
            err.fotoUrl = 'Ingresa una URL de imagen válida (http/https).'
        }

        return err
    }

    function actualizarCampo<K extends keyof ValoresFormulario>(campo: K, valor: ValoresFormulario[K]) {
        setValores((prev) => ({ ...prev, [campo]: valor }))
        if (errores[campo]) {
            setErrores((prev) => ({ ...prev, [campo]: undefined }))
        }
        setNotificacion(null)
    }

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        setNotificacion(null)

        const erroresValidacion = validar(valores)
        if (Object.keys(erroresValidacion).length > 0) {
            setErrores(erroresValidacion)
            setNotificacion({
                tipo: 'error',
                mensaje: 'Por favor, corrige los campos marcados antes de continuar.',
            })
            return
        }

        setEnviando(true)

        try {
            // Simulación de llamada API
            await new Promise((resolve) => setTimeout(resolve, 1200))

            setNotificacion({
                tipo: 'exito',
                mensaje: `¡Felino "${valores.nombre}" (${valores.codigoFelino}) registrado exitosamente!`,
            })
            setValores(VALORES_INICIALES)
            setErrores({})
        } catch {
            setNotificacion({
                tipo: 'error',
                mensaje: 'Ocurrió un error al intentar registrar el felino. Intenta de nuevo.',
            })
        } finally {
            setEnviando(false)
            botonRef.current?.focus()
        }
    }

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
            <header>
                <h1 className="font-heading text-2xl font-semibold text-marino sm:text-3xl">
                    Alta de Felino
                </h1>
                <p className="mt-1 text-sm text-marino/70 sm:text-base">
                    Registra un nuevo gato en el sistema para su seguimiento médico, de cuarentena o catálogo de adopción.
                </p>
            </header>

            <div className="grid gap-8 lg:grid-cols-12">
                {/* Formulario Principal */}
                <form onSubmit={handleSubmit} noValidate className="space-y-6 lg:col-span-7">
                    {/* Tarjeta Datos Básicos */}
                    <section className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-[#D9C3A5]/70 sm:p-6">
                        <h2 className="font-heading text-lg font-semibold text-marino">
                            Identificación y Estado
                        </h2>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <CampoForm etiqueta="Código único" obligatorio error={errores.codigoFelino}>
                                {(id) => (
                                    <div className="flex gap-2">
                                        <input
                                            id={id}
                                            type="text"
                                            placeholder="Ej. CAT-001"
                                            value={valores.codigoFelino}
                                            onChange={(e) => actualizarCampo('codigoFelino', e.target.value)}
                                            className="w-full rounded-xl border border-marino/40 bg-white px-3.5 py-2.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                                        />
                                        <button
                                            type="button"
                                            onClick={generarCodigo}
                                            className="shrink-0 rounded-xl bg-crema px-3 py-2 text-xs font-bold text-cafe border border-beige hover:bg-beige/20"
                                        >
                                            Generar
                                        </button>
                                    </div>
                                )}
                            </CampoForm>

                            <CampoForm etiqueta="Nombre" obligatorio error={errores.nombre}>
                                {(id) => (
                                    <input
                                        id={id}
                                        type="text"
                                        placeholder="Ej. Michi"
                                        value={valores.nombre}
                                        onChange={(e) => actualizarCampo('nombre', e.target.value)}
                                        className="w-full rounded-xl border border-marino/40 bg-white px-3.5 py-2.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                                    />
                                )}
                            </CampoForm>

                            <CampoForm etiqueta="Estado inicial" obligatorio error={errores.estado}>
                                {(id) => (
                                    <select
                                        id={id}
                                        value={valores.estado}
                                        onChange={(e) => actualizarCampo('estado', e.target.value as EstadoGato)}
                                        className="w-full rounded-xl border border-marino/40 bg-white px-3.5 py-2.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                                    >
                                        <option value="CUARENTENA">Cuarentena</option>
                                        <option value="DISPONIBLE">Disponible</option>
                                        <option value="ADOPCION">En Adopción</option>
                                        <option value="ADOPTADO">Adoptado</option>
                                    </select>
                                )}
                            </CampoForm>

                            <CampoForm etiqueta="Sexo" obligatorio error={errores.sexo}>
                                {(id) => (
                                    <select
                                        id={id}
                                        value={valores.sexo}
                                        onChange={(e) => actualizarCampo('sexo', e.target.value as SexoGato)}
                                        className="w-full rounded-xl border border-marino/40 bg-white px-3.5 py-2.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="MACHO">Macho</option>
                                        <option value="HEMBRA">Hembra</option>
                                    </select>
                                )}
                            </CampoForm>
                        </div>
                    </section>

                    {/* Tarjeta Características Físicas */}
                    <section className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-[#D9C3A5]/70 sm:p-6">
                        <h2 className="font-heading text-lg font-semibold text-marino">
                            Características Físicas
                        </h2>

                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <CampoForm etiqueta="Peso (kg)" obligatorio error={errores.peso}>
                                {(id) => (
                                    <input
                                        id={id}
                                        type="number"
                                        step="0.01"
                                        min="0.1"
                                        placeholder="Ej. 3.5"
                                        value={valores.peso}
                                        onChange={(e) => actualizarCampo('peso', e.target.value)}
                                        className="w-full rounded-xl border border-marino/40 bg-white px-3.5 py-2.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                                    />
                                )}
                            </CampoForm>

                            <CampoForm etiqueta="Edad (meses)" obligatorio error={errores.edadMeses}>
                                {(id) => (
                                    <input
                                        id={id}
                                        type="number"
                                        min="1"
                                        placeholder="Ej. 12"
                                        value={valores.edadMeses}
                                        onChange={(e) => actualizarCampo('edadMeses', e.target.value)}
                                        className="w-full rounded-xl border border-marino/40 bg-white px-3.5 py-2.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                                    />
                                )}
                            </CampoForm>

                            <CampoForm etiqueta="Talla" error={errores.talla}>
                                {(id) => (
                                    <select
                                        id={id}
                                        value={valores.talla}
                                        onChange={(e) => actualizarCampo('talla', e.target.value as TallaFelino)}
                                        className="w-full rounded-xl border border-marino/40 bg-white px-3.5 py-2.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                                    >
                                        <option value="">Seleccionar...</option>
                                        <option value="Pequeño">Pequeño</option>
                                        <option value="Mediano">Mediano</option>
                                        <option value="Grande">Grande</option>
                                    </select>
                                )}
                            </CampoForm>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2">
                            <CampoForm etiqueta="Temperamento" error={errores.temperamento}>
                                {(id) => (
                                    <input
                                        id={id}
                                        type="text"
                                        placeholder="Ej. Cariñoso, juguetón"
                                        value={valores.temperamento}
                                        onChange={(e) => actualizarCampo('temperamento', e.target.value)}
                                        className="w-full rounded-xl border border-marino/40 bg-white px-3.5 py-2.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                                    />
                                )}
                            </CampoForm>

                            <CampoForm etiqueta="Color de pelaje" error={errores.colorPelaje}>
                                {(id) => (
                                    <input
                                        id={id}
                                        type="text"
                                        placeholder="Ej. Naranja atigrado"
                                        value={valores.colorPelaje}
                                        onChange={(e) => actualizarCampo('colorPelaje', e.target.value)}
                                        className="w-full rounded-xl border border-marino/40 bg-white px-3.5 py-2.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                                    />
                                )}
                            </CampoForm>
                        </div>
                    </section>

                    {/* Tarjeta Multimedia e Historia */}
                    <section className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-[#D9C3A5]/70 sm:p-6">
                        <h2 className="font-heading text-lg font-semibold text-marino">
                            Ficha Pública y Multimedia
                        </h2>

                        <div className="mt-4 space-y-4">
                            <CampoForm etiqueta="URL Fotografía" error={errores.fotoUrl}>
                                {(id) => (
                                    <input
                                        id={id}
                                        type="url"
                                        placeholder="https://ejemplo.com/fotos/gato.jpg"
                                        value={valores.fotoUrl}
                                        onChange={(e) => actualizarCampo('fotoUrl', e.target.value)}
                                        className="w-full rounded-xl border border-marino/40 bg-white px-3.5 py-2.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                                    />
                                )}
                            </CampoForm>

                            <CampoForm etiqueta="Historia / Notas" error={errores.historia}>
                                {(id) => (
                                    <textarea
                                        id={id}
                                        rows={3}
                                        placeholder="Escribe un breve resumen de cómo fue hallado o detalles de personalidad..."
                                        value={valores.historia}
                                        onChange={(e) => actualizarCampo('historia', e.target.value)}
                                        className="w-full rounded-xl border border-marino/40 bg-white px-3.5 py-2.5 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-[#A9D6E8]"
                                    />
                                )}
                            </CampoForm>
                        </div>
                    </section>

                    {/* Notificaciones */}
                    {notificacion && (
                        <div
                            aria-live="polite"
                            className={`flex items-center gap-3 rounded-xl p-4 text-sm font-medium ${notificacion.tipo === 'exito'
                                    ? 'bg-green-50 text-green-900 ring-1 ring-green-600/30'
                                    : 'bg-red-50 text-red-900 ring-1 ring-red-600/30'
                                }`}
                        >
                            <span>{notificacion.tipo === 'exito' ? '✅' : '⚠️'}</span>
                            <p>{notificacion.mensaje}</p>
                        </div>
                    )}

                    {/* Botón de Enviar */}
                    <div className="flex justify-end">
                        <button
                            ref={botonRef}
                            type="submit"
                            disabled={enviando}
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-marino px-8 font-semibold text-crema transition hover:bg-marino/90 focus:outline-none focus:ring-2 focus:ring-[#A9D6E8] focus:ring-offset-2 disabled:opacity-70 sm:w-auto"
                        >
                            {enviando ? (
                                <>
                                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                                    </svg>
                                    <span>Guardando...</span>
                                </>
                            ) : (
                                <span>Registrar Felino</span>
                            )}
                        </button>
                    </div>
                </form>

                {/* Columna de Previsualización */}
                <aside className="space-y-4 lg:col-span-5">
                    <div className="sticky top-6">
                        <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wider text-cafe">
                            Previsualización de Tarjeta
                        </h2>
                        <GatoCard
                            codigoFelino={valores.codigoFelino || 'CAT-PREVIEW'}
                            nombre={valores.nombre || 'Nombre del gato'}
                            peso={parseFloat(valores.peso) || 0}
                            talla={valores.talla}
                            edadMeses={parseInt(valores.edadMeses, 10) || 0}
                            temperamento={valores.temperamento}
                            colorPelaje={valores.colorPelaje}
                            sexo={valores.sexo || undefined}
                            estado={valores.estado}
                            fotoUrl={valores.fotoUrl}
                            historia={valores.historia}
                            modoPublico={false}
                        />
                    </div>
                </aside>
            </div>
        </div>
    )
}

function CampoForm({
    etiqueta,
    obligatorio,
    error,
    children,
}: {
    etiqueta: string
    obligatorio?: boolean
    error?: string
    children: (id: string) => ReactNode
}) {
    const id = useId()
    return (
        <div className="flex flex-col gap-1.5">
            <label htmlFor={id} className="text-sm font-semibold text-marino">
                {etiqueta} {obligatorio && <span className="text-cafe">*</span>}
            </label>
            {children(id)}
            {error && <span className="text-xs font-medium text-red-600">{error}</span>}
        </div>
    )
}