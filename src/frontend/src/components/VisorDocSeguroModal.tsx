import { useEffect, useState } from 'react'
import { AlertCircle, FileCheck2, Loader2, ShieldAlert, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import {
    obtenerDocumentoSeguroBlob,
    PostulacionApiError,
} from '../services/postulacionesService'
import type { NombreCampoDocumento } from '../types/postulacion'

interface VisorDocumentoSeguroModalProps {
    abierto: boolean
    onCerrar: () => void
    postulacionId: string
    campo: NombreCampoDocumento | null
    tituloDocumento: string
}

export default function VisorDocSeguroModal({
    abierto,
    onCerrar,
    postulacionId,
    campo,
    tituloDocumento,
}: VisorDocumentoSeguroModalProps) {
    const { usuario } = useAuth()
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [objectUrl, setObjectUrl] = useState<string | null>(null)
    const [tipoMime, setTipoMime] = useState<string>('')
    const [nombreArchivo, setNombreArchivo] = useState<string>('')

    useEffect(() => {
        if (!abierto || !campo) return

        let urlCreada: string | null = null
        let cancelado = false

        async function cargarDocumentoProtegido() {
            setCargando(true)
            setError(null)
            setObjectUrl(null)

            try {
                const esAdmin = usuario?.rol === 'ADMIN'
                const resultado = await obtenerDocumentoSeguroBlob(postulacionId, campo!, esAdmin)

                if (cancelado) return

                urlCreada = URL.createObjectURL(resultado.blob)
                setObjectUrl(urlCreada)
                setTipoMime(resultado.tipoMime)
                setNombreArchivo(resultado.nombreArchivo)
            } catch (err) {
                if (cancelado) return
                if (err instanceof PostulacionApiError) {
                    setError(err.message)
                } else {
                    setError('No se pudo descifrar y cargar el documento protegido.')
                }
            } finally {
                if (!cancelado) setCargando(false)
            }
        }

        cargarDocumentoProtegido()

        return () => {
            cancelado = true
            if (urlCreada) {
                URL.revokeObjectURL(urlCreada)
            }
        }
    }, [abierto, campo, postulacionId, usuario?.rol])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onCerrar()
        }
        if (abierto) window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [abierto, onCerrar])

    if (!abierto || !campo) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-marino/65 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="visor-doc-titulo"
        >
            <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-beige">
                {/* Cabecera del Visor */}
                <div className="flex items-center justify-between border-b border-beige/60 bg-crema/60 px-6 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marino text-crema">
                            <FileCheck2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <h2 id="visor-doc-titulo" className="truncate font-heading text-lg font-bold text-marino">
                                {tituloDocumento}
                            </h2>
                            <p className="flex items-center gap-1.5 text-xs text-cafe font-medium">
                                <ShieldCheck className="h-3.5 w-3.5 text-green-700" />
                                <span>Visualización protegida · Cifrado AES-256 (Rol ADMIN)</span>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCerrar}
                        aria-label="Cerrar visor"
                        className="rounded-xl p-2 text-marino/70 transition hover:bg-white hover:text-marino cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Área de Visualización */}
                <div className="flex-1 overflow-y-auto bg-crema/30 p-6 flex items-center justify-center min-h-80">
                    {cargando ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-marino" />
                            <p className="text-sm font-semibold text-marino">
                                Descifrando documento mediante canal autorizado...
                            </p>
                        </div>
                    ) : error ? (
                        <div className="max-w-md rounded-2xl bg-red-50 p-6 text-center ring-1 ring-red-200">
                            <ShieldAlert className="mx-auto h-10 w-10 text-red-600" />
                            <h3 className="mt-3 font-heading text-base font-bold text-red-900">
                                No fue posible visualizar el archivo
                            </h3>
                            <p className="mt-1 text-xs text-red-800">{error}</p>
                        </div>
                    ) : objectUrl ? (
                        <div className="w-full space-y-3">
                            {tipoMime === 'application/pdf' ? (
                                <iframe
                                    src={`${objectUrl}#toolbar=0`}
                                    title={tituloDocumento}
                                    className="h-[60vh] w-full rounded-2xl border border-beige bg-white"
                                />
                            ) : (
                                <div className="overflow-hidden rounded-2xl border border-beige bg-white p-2 shadow-xs">
                                    <img
                                        src={objectUrl}
                                        alt={tituloDocumento}
                                        className="mx-auto max-h-[60vh] w-auto rounded-xl object-contain"
                                    />
                                </div>
                            )}

                            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-2.5 text-xs text-marino/75 ring-1 ring-beige/70">
                                <span>
                                    Archivo: <strong className="text-marino">{nombreArchivo}</strong>
                                </span>
                                <span className="inline-flex items-center gap-1 text-cafe font-semibold">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    Sin enlace público expuesto
                                </span>
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}