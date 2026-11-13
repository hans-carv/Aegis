import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { AlertCircle, CheckCircle2, FileText, RefreshCw, UploadCloud } from 'lucide-react'
import type { NombreCampoDocumento } from '../types/postulacion'

interface DocumentoDropzoneProps {
    campo: NombreCampoDocumento
    titulo: string
    descripcion: string
    archivo: File | null
    onSeleccionar: (campo: NombreCampoDocumento, file: File) => void
}

const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const EXTENSIONES_VALIDAS = ['application/pdf', 'image/jpeg', 'image/png']

function formatearTamano(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function obtenerEtiquetaFormato(mime: string): string {
    if (mime === 'application/pdf') return 'PDF'
    if (mime === 'image/jpeg') return 'JPG'
    if (mime === 'image/png') return 'PNG'
    return 'ARCHIVO'
}

export default function DocumentoDropZone({
    campo,
    titulo,
    descripcion,
    archivo,
    onSeleccionar,
}: DocumentoDropzoneProps) {
    const inputRef = useRef<HTMLInputElement>(null)
    const [arrastrando, setArrastrando] = useState(false)
    const [errorLocal, setErrorLocal] = useState<string | null>(null)

    function validarYAsignar(file: File | undefined) {
        if (!file) return
        setErrorLocal(null)

        if (!EXTENSIONES_VALIDAS.includes(file.type)) {
            setErrorLocal('Formato no válido. Solo se aceptan archivos PDF, JPG o PNG.')
            return
        }

        if (file.size > MAX_SIZE_BYTES) {
            setErrorLocal('El archivo excede el límite máximo de 5 MB.')
            return
        }

        onSeleccionar(campo, file)
    }

    function handleDrop(e: DragEvent<HTMLDivElement>) {
        e.preventDefault()
        setArrastrando(false)
        const file = e.dataTransfer.files?.[0]
        validarYAsignar(file)
    }

    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        validarYAsignar(file)
        e.target.value = '' // Permite volver a seleccionar el mismo archivo si se desea
    }

    return (
        <div className="rounded-2xl border border-beige/80 bg-white p-4 shadow-xs">
            <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                    <h3 className="font-heading text-sm font-bold text-marino">
                        {titulo} <span className="text-cafe">*</span>
                    </h3>
                    <p className="text-xs text-marino/65">{descripcion}</p>
                </div>

                {archivo ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Cargado
                    </span>
                ) : (
                    <span className="rounded-full bg-crema px-2.5 py-0.5 text-xs font-semibold text-cafe ring-1 ring-beige">
                        Pendiente
                    </span>
                )}
            </div>

            <input
                ref={inputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                onChange={handleChange}
                className="hidden"
            />

            {!archivo ? (
                <div
                    role="button"
                    tabIndex={0}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            inputRef.current?.click()
                        }
                    }}
                    onDragOver={(e) => {
                        e.preventDefault()
                        setArrastrando(true)
                    }}
                    onDragLeave={() => setArrastrando(false)}
                    onDrop={handleDrop}
                    className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition cursor-pointer ${arrastrando
                            ? 'border-marino bg-celeste/25'
                            : 'border-beige bg-crema/40 hover:border-marino/50 hover:bg-crema/80'
                        }`}
                >
                    <UploadCloud className="h-7 w-7 text-marino/60" />
                    <p className="mt-2 text-xs font-semibold text-marino">
                        Arrastra tu archivo aquí o <span className="underline text-cafe">haz clic para buscar</span>
                    </p>
                    <p className="mt-1 text-[11px] text-marino/55">
                        PDF, JPG o PNG · Máximo 5 MB
                    </p>
                </div>
            ) : (
                <div className="mt-2 flex flex-col justify-between gap-3 rounded-xl bg-crema/70 p-3.5 ring-1 ring-beige/70 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marino text-crema">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-marino">{archivo.name}</p>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-marino/70">
                                <span className="rounded bg-white px-1.5 py-0.5 font-semibold text-cafe ring-1 ring-beige">
                                    {obtenerEtiquetaFormato(archivo.type)}
                                </span>
                                <span>{formatearTamano(archivo.size)}</span>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-beige bg-white px-3 py-2 text-xs font-semibold text-marino transition hover:bg-celeste/25 cursor-pointer"
                    >
                        <RefreshCw className="h-3.5 w-3.5" />
                        <span>Reemplazar</span>
                    </button>
                </div>
            )}

            {errorLocal && (
                <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-700">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorLocal}</span>
                </p>
            )}
        </div>
    )
}