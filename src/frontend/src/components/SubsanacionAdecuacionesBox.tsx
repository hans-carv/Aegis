import { useEffect, useState, type SubmitEvent } from 'react'
import {
    AlertCircle, CheckCircle2, Clock, ExternalLink,
    Image as ImageIcon,
    Link2, Plus, Send, Trash2, Wrench,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import {
    obtenerVisitaPorPostulacion,
    registrarEvidenciaAdecuacion
} from '../services/visitasDomiciliariasService'
import type { VisitaDomiciliaria } from '../types/visitaDomiciliaria'

interface SubsanacionAdecuacionesBoxProps {
    postulacionId: string
}

export default function SubsanacionAdecuacionesBox({
    postulacionId,
}: SubsanacionAdecuacionesBoxProps) {
    const { usuario } = useAuth()

    const [visita, setVisita] = useState<VisitaDomiciliaria | null>(null)
    const [cargando, setCargando] = useState(true)

    // Manejo de URLs a registrar
    const [urlInput, setUrlInput] = useState('')
    const [urlsPendientes, setUrlsPendientes] = useState<string[]>([])

    const [enviando, setEnviando] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [exito, setExito] = useState<string | null>(null)

    useEffect(() => {
        obtenerVisitaPorPostulacion(postulacionId)
            .then(setVisita)
            .finally(() => setCargando(false))
    }, [postulacionId])

    if (cargando || !visita || visita.dictamen !== 'PENDIENTE_ADECUACIONES') {
        return null
    }

    const hoyISO = new Date().toISOString().split('T')[0]
    const plazoVencido = Boolean(
        visita.fechaLimiteSubsanacion && hoyISO > visita.fechaLimiteSubsanacion
    )

    function validarFormatoUrlORuta(valor: string): boolean {
        if (valor.startsWith('/')) return valor.length > 1
        try {
            const parsed = new URL(valor)
            return parsed.protocol === 'http:' || parsed.protocol === 'https:'
        } catch {
            return false
        }
    }

    function agregarUrlALista() {
        setError(null)
        setExito(null)

        const limpia = urlInput.trim()
        if (!limpia) {
            setError('Ingresa una URL o ruta válida de imagen antes de agregarla.')
            return
        }

        if (!validarFormatoUrlORuta(limpia)) {
            setError('Formato inválido. Usa una URL (https://...) o una ruta válida (/uploads/...).')
            return
        }

        if (
            urlsPendientes.includes(limpia) ||
            visita?.evidenciaAdecuacionesUrls.includes(limpia)
        ) {
            setError('Esta URL ya se encuentra en la lista de evidencias.')
            return
        }

        setUrlsPendientes((prev) => [...prev, limpia])
        setUrlInput('')
    }

    function quitarUrlPendiente(urlARemover: string) {
        setUrlsPendientes((prev) => prev.filter((u) => u !== urlARemover))
    }

    async function manejarEnvioEvidencias(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!visita) return
        setError(null)
        setExito(null)

        // Si el usuario escribió una URL en el input pero olvidó pulsar "+", la incluimos automáticamente
        const listaFinal = [...urlsPendientes]
        const inputActual = urlInput.trim()

        if (inputActual) {
            if (!validarFormatoUrlORuta(inputActual)) {
                setError('La URL ingresada no tiene un formato válido (https://... o /ruta/...).')
                return
            }
            if (!listaFinal.includes(inputActual)) {
                listaFinal.push(inputActual)
            }
        }

        if (listaFinal.length === 0) {
            setError('Debes agregar al menos una URL de fotografía para enviar.')
            return
        }

        setEnviando(true)
        try {
            const actualizada = await registrarEvidenciaAdecuacion(
                visita.id,
                usuario?.email,
                listaFinal
            )
            setVisita((prev) => (prev ? { ...prev, ...actualizada } : actualizada))
            setUrlsPendientes([])
            setUrlInput('')
            setExito(
                listaFinal.length === 1
                    ? 'Evidencia fotográfica registrada correctamente.'
                    : `${listaFinal.length} evidencias fotográficas registradas correctamente.`
            )
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'No se pudieron registrar las URLs de evidencia.'
            )
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div className="mt-4 space-y-3.5 rounded-2xl border border-beige bg-crema/70 p-4 text-xs">
            {/* Cabecera y Plazo */}
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-bold text-cafe">
                    <Wrench className="h-4 w-4 shrink-0" />
                    <span>Adecuaciones requeridas en domicilio</span>
                </div>

                {visita.fechaLimiteSubsanacion && (
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${plazoVencido
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-cafe'
                            }`}
                    >
                        <Clock className="h-3 w-3" />
                        {plazoVencido
                            ? `Vencido (${visita.fechaLimiteSubsanacion})`
                            : `Límite: ${visita.fechaLimiteSubsanacion}`}
                    </span>
                )}
            </div>

            {/* Observaciones de la Administradora */}
            <p className="rounded-xl bg-white p-3 text-marino/85 ring-1 ring-beige/60">
                <strong>Observaciones de evaluación:</strong> {visita.observacionesDictamen}
            </p>

            {/* Galería de Evidencias Anteriormente Registradas */}
            {visita.evidenciaAdecuacionesUrls.length > 0 && (
                <div className="space-y-2">
                    <p className="font-semibold text-marino">
                        Evidencias registradas ({visita.evidenciaAdecuacionesUrls.length}):
                    </p>
                    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                        {visita.evidenciaAdecuacionesUrls.map((url, idx) => (
                            <a
                                key={`${url}-${idx}`}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                title={url}
                                className="group relative flex flex-col overflow-hidden rounded-xl border border-beige bg-white shadow-2xs transition hover:border-marino"
                            >
                                <div className="relative h-20 w-full bg-crema/50">
                                    <img
                                        src={url}
                                        alt={`Evidencia de adecuación ${idx + 1}`}
                                        className="h-full w-full object-cover transition group-hover:scale-105"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none'
                                        }}
                                    />
                                    <span className="absolute top-1.5 right-1.5 rounded-md bg-marino/80 p-1 text-crema opacity-0 transition group-hover:opacity-100">
                                        <ExternalLink className="h-3 w-3" />
                                    </span>
                                </div>
                                <span className="flex items-center gap-1 truncate px-2 py-1.5 text-[11px] font-medium text-marino/80">
                                    <ImageIcon className="h-3 w-3 shrink-0 text-cafe" />
                                    <span className="truncate">{url}</span>
                                </span>
                            </a>
                        ))}
                    </div>
                </div>
            )}

            {/* Formulario de Registro de URLs o Aviso de Plazo Vencido */}
            {plazoVencido ? (
                <div className="flex items-center gap-2 rounded-xl bg-red-50 p-2.5 font-medium text-red-800 ring-1 ring-red-200">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                    <span>
                        El plazo de subsanación venció el {visita.fechaLimiteSubsanacion}. Ya no es posible registrar nuevas evidencias.
                    </span>
                </div>
            ) : (
                <form onSubmit={manejarEnvioEvidencias} className="space-y-2.5 border-t border-beige/60 pt-3">
                    <label
                        htmlFor={`url-evidencia-${visita.id}`}
                        className="block font-semibold text-marino"
                    >
                        Registrar URLs de fotografías de las adecuaciones
                    </label>

                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Link2 className="pointer-events-none absolute top-1/2 left-3 h-3.5 w-3.5 -translate-y-1/2 text-marino/45" />
                            <input
                                id={`url-evidencia-${visita.id}`}
                                type="text"
                                placeholder="https://ejemplo.com/malla-ventana.jpg"
                                value={urlInput}
                                onChange={(e) => setUrlInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault()
                                        agregarUrlALista()
                                    }
                                }}
                                className="h-9 w-full rounded-xl border border-beige bg-white pr-3 pl-8 text-xs text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={agregarUrlALista}
                            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-xl border border-beige bg-white px-3 font-semibold text-marino transition hover:bg-celeste/30 cursor-pointer"
                        >
                            <Plus className="h-3.5 w-3.5" />
                            <span>Agregar</span>
                        </button>
                    </div>

                    {/* Lista de URLs pendientes por enviar */}
                    {urlsPendientes.length > 0 && (
                        <ul className="space-y-1.5 rounded-xl bg-white p-2.5 ring-1 ring-beige/70">
                            {urlsPendientes.map((url) => (
                                <li
                                    key={url}
                                    className="flex items-center justify-between gap-2 text-[11px] text-marino"
                                >
                                    <span className="truncate font-medium">{url}</span>
                                    <button
                                        type="button"
                                        onClick={() => quitarUrlPendiente(url)}
                                        aria-label="Quitar URL"
                                        className="rounded p-1 text-red-600 hover:bg-red-50 cursor-pointer"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <button
                        type="submit"
                        disabled={enviando}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-marino px-4 py-2 font-semibold text-crema transition hover:bg-marino/90 disabled:opacity-60 cursor-pointer"
                    >
                        <Send className="h-3.5 w-3.5" />
                        <span>{enviando ? 'Guardando URLs...' : 'Guardar evidencias'}</span>
                    </button>
                </form>
            )}

            {error && (
                <p role="alert" className="flex items-center gap-1.5 font-medium text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{error}</span>
                </p>
            )}

            {exito && (
                <p className="flex items-center gap-1.5 font-medium text-green-800">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-700" />
                    <span>{exito}</span>
                </p>
            )}
        </div>
    )
}