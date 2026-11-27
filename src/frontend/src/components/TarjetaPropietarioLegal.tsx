import { useState, type ChangeEvent, type FormEvent } from 'react'
import {
    AlertCircle,
    Award,
    Calendar,
    CheckCircle2,
    Download,
    FileCheck2,
    FileText,
    IdCard,
    Mail,
    MapPin,
    Phone,
    ShieldCheck,
    Upload,
    User,
} from 'lucide-react'
import { descargarContratoPdf, subirContratoFirmado } from '../services/adopcionesService'
import { useToast } from '../context/ToastContext'
import type { PropietarioLegalActual } from '../types/adopcion'

interface TarjetaPropietarioLegalProps {
    propietario: PropietarioLegalActual
    codigoFelino?: string
    gatoNombre?: string
    onContratoActualizado?: (cambios: {
        contratoGeneradoAt?: string | null
        contratoFirmadoUrl?: string | null
    }) => void
}

function formatearFechaHora(iso?: string | null) {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        })
    } catch {
        return iso
    }
}

export default function TarjetaPropietarioLegal({
    propietario,
    codigoFelino,
    gatoNombre,
    onContratoActualizado,
}: TarjetaPropietarioLegalProps) {
    const { mostrarToast } = useToast()
    const [descargandoPdf, setDescargandoPdf] = useState(false)
    const [archivoFirma, setArchivoFirma] = useState<File | null>(null)
    const [urlFirmaManual, setUrlFirmaManual] = useState('')
    const [subiendoContrato, setSubiendoContrato] = useState(false)
    const [mensajeExito, setMensajeExito] = useState<string | null>(null)
    const [errorAccion, setErrorAccion] = useState<string | null>(null)

    async function manejarDescargarPdf() {
        setErrorAccion(null)
        setMensajeExito(null)
        setDescargandoPdf(true)

        try {
            const { blobUrl, filename } = await descargarContratoPdf(propietario.adopcionId)

            // Abrir previsualización y disparar descarga
            const link = document.createElement('a')
            link.href = blobUrl
            link.download = filename
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            window.open(blobUrl, '_blank', 'noopener,noreferrer')

            setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000)

            const ahoraIso = new Date().toISOString()
            const msg = `Contrato PDF generado correctamente (${filename}).`
            setMensajeExito(msg)
            mostrarToast(msg, 'success')
            onContratoActualizado?.({ contratoGeneradoAt: ahoraIso })
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'No se pudo generar el contrato PDF.'
            setErrorAccion(msg)
            mostrarToast(msg, 'error')
        } finally {
            setDescargandoPdf(false)
        }
    }

    function manejarCambioArchivo(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0] || null
        setArchivoFirma(file)
        setErrorAccion(null)
    }

    async function manejarSubirFirmado(e: FormEvent) {
        e.preventDefault()
        setErrorAccion(null)
        setMensajeExito(null)

        if (!archivoFirma && !urlFirmaManual.trim()) {
            setErrorAccion('Adjunta el archivo PDF/imagen escaneada del contrato o ingresa su enlace.')
            return
        }

        setSubiendoContrato(true)
        try {
            const res = await subirContratoFirmado(propietario.adopcionId, {
                ...(archivoFirma ? { archivo: archivoFirma } : {}),
                ...(urlFirmaManual.trim() ? { contratoFirmadoUrl: urlFirmaManual.trim() } : {}),
            })

            setArchivoFirma(null)
            setUrlFirmaManual('')
            const msg = 'Copia del contrato firmado almacenada y verificada en el sistema.'
            setMensajeExito(msg)
            mostrarToast(msg, 'success')
            onContratoActualizado?.({
                contratoFirmadoUrl: res.contratoFirmadoUrl,
                contratoGeneradoAt: res.contratoGeneradoAt || propietario.contratoGeneradoAt,
            })
        } catch (err) {
            setErrorAccion(
                err instanceof Error ? err.message : 'No se pudo registrar el contrato firmado.'
            )
        } finally {
            setSubiendoContrato(false)
        }
    }

    return (
        <div className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm ring-1 ring-emerald-600/15 space-y-4">
            {/* Cabecera Propietario Legal Actual */}
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-beige/50 pb-3.5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                        <Award className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                            Propietario / Adoptante Legal Actual
                        </p>
                        <h3 className="font-heading text-lg font-bold text-marino">
                            {propietario.nombreCompleto}
                        </h3>
                        {(gatoNombre || codigoFelino) && (
                            <p className="text-xs text-cafe">
                                Tenencia legal de <strong>{gatoNombre}</strong>{' '}
                                {codigoFelino ? `(${codigoFelino})` : ''}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800 ring-1 ring-emerald-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Vínculo {propietario.estadoVinculo || 'VIGENTE'}
                    </span>
                    {propietario.contratoFirmadoUrl ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-celeste/45 px-3 py-1 text-xs font-bold text-marino ring-1 ring-celeste">
                            <FileCheck2 className="h-3.5 w-3.5" />
                            Contrato firmado
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-cafe ring-1 ring-beige">
                            <FileText className="h-3.5 w-3.5" />
                            Firma pendiente
                        </span>
                    )}
                </div>
            </div>

            {/* Datos de contacto y tenencia */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs">
                <div className="rounded-xl bg-crema/50 p-3 ring-1 ring-beige/60">
                    <p className="flex items-center gap-1.5 font-semibold text-cafe">
                        <User className="h-3.5 w-3.5" />
                        Correo electrónico
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 truncate font-bold text-marino">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-marino/50" />
                        {propietario.email}
                    </p>
                </div>

                <div className="rounded-xl bg-crema/50 p-3 ring-1 ring-beige/60">
                    <p className="flex items-center gap-1.5 font-semibold text-cafe">
                        <Phone className="h-3.5 w-3.5" />
                        Teléfono de contacto
                    </p>
                    <p className="mt-1 font-bold text-marino">{propietario.telefonoTenencia}</p>
                </div>

                <div className="rounded-xl bg-crema/50 p-3 ring-1 ring-beige/60">
                    <p className="flex items-center gap-1.5 font-semibold text-cafe">
                        <IdCard className="h-3.5 w-3.5" />
                        Cédula de Identidad (CI)
                    </p>
                    <p className="mt-1 font-bold text-marino">
                        {propietario.ci || 'S/N - Verificar en expediente'}
                    </p>
                </div>

                <div className="rounded-xl bg-crema/50 p-3 ring-1 ring-beige/60 sm:col-span-2">
                    <p className="flex items-center gap-1.5 font-semibold text-cafe">
                        <MapPin className="h-3.5 w-3.5" />
                        Dirección de tenencia verificada
                    </p>
                    <p className="mt-1 font-bold text-marino">{propietario.direccionTenencia}</p>
                </div>

                <div className="rounded-xl bg-crema/50 p-3 ring-1 ring-beige/60">
                    <p className="flex items-center gap-1.5 font-semibold text-cafe">
                        <Calendar className="h-3.5 w-3.5" />
                        Fecha de adopción formal
                    </p>
                    <p className="mt-1 font-bold text-marino">
                        {formatearFechaHora(propietario.fechaAdopcion)}
                    </p>
                </div>
            </div>

            {propietario.observacionesEntrega && (
                <div className="rounded-xl bg-crema/40 p-3 text-xs text-marino ring-1 ring-beige/60">
                    <strong className="text-cafe">Observaciones de entrega: </strong>
                    {propietario.observacionesEntrega}
                </div>
            )}

            {/* Módulo de Contrato Legal PDF y Copia Firmada (SCRUM-94) */}
            <div className="rounded-2xl bg-crema/55 p-4 ring-1 ring-beige/70 space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h4 className="font-heading text-sm font-bold text-marino">
                            Contrato Legal de Adopción (PDF)
                        </h4>
                        <p className="text-[11px] text-marino/70">
                            {propietario.contratoGeneradoAt
                                ? `Última emisión registrada: ${formatearFechaHora(propietario.contratoGeneradoAt)}`
                                : 'Genera el documento legal autocompletado con los datos del adoptante y el felino.'}
                        </p>
                    </div>

                    <button
                        type="button"
                        disabled={descargandoPdf}
                        onClick={manejarDescargarPdf}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-marino px-4 py-2.5 text-xs font-semibold text-crema shadow-sm transition hover:bg-marino/90 disabled:opacity-60 cursor-pointer"
                    >
                        <Download className="h-4 w-4" />
                        <span>
                            {descargandoPdf
                                ? 'Generando PDF...'
                                : 'Generar / Descargar Contrato PDF'}
                        </span>
                    </button>
                </div>

                {/* Estado del contrato firmado */}
                {propietario.contratoFirmadoUrl && (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-2.5 text-xs font-medium text-emerald-900 ring-1 ring-emerald-200">
                        <FileCheck2 className="h-4 w-4 shrink-0 text-emerald-700" />
                        <span className="truncate">
                            Copia firmada archivada: <strong>{propietario.contratoFirmadoUrl}</strong>
                        </span>
                    </div>
                )}

                {/* Subida de contrato firmado */}
                <form
                    onSubmit={manejarSubirFirmado}
                    className="flex flex-col gap-2.5 border-t border-beige/60 pt-3 sm:flex-row sm:items-center"
                >
                    <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-beige bg-white px-3 py-2 text-xs text-marino/80 hover:border-marino">
                        <Upload className="h-4 w-4 shrink-0 text-cafe" />
                        <span className="truncate">
                            {archivoFirma
                                ? archivoFirma.name
                                : 'Adjuntar copia firmada (PDF o imagen)'}
                        </span>
                        <input
                            type="file"
                            accept=".pdf,image/png,image/jpeg,image/webp"
                            onChange={manejarCambioArchivo}
                            className="sr-only"
                        />
                    </label>

                    <input
                        type="text"
                        value={urlFirmaManual}
                        onChange={(e) => setUrlFirmaManual(e.target.value)}
                        placeholder="o URL del documento firmado..."
                        className="h-9 rounded-xl border border-beige bg-white px-3 text-xs text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste sm:w-56"
                    />

                    <button
                        type="submit"
                        disabled={subiendoContrato}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-xl bg-cafe px-4 text-xs font-semibold text-crema transition hover:bg-cafe/90 disabled:opacity-60 cursor-pointer"
                    >
                        <Upload className="h-3.5 w-3.5" />
                        <span>{subiendoContrato ? 'Subiendo...' : 'Subir firmado'}</span>
                    </button>
                </form>

                {errorAccion && (
                    <p role="alert" className="flex items-center gap-1.5 text-xs font-medium text-red-700">
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{errorAccion}</span>
                    </p>
                )}

                {mensajeExito && (
                    <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-800">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                        <span>{mensajeExito}</span>
                    </p>
                )}
            </div>
        </div>
    )
}
