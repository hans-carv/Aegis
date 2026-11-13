import { useEffect, useState, type SubmitEvent } from 'react'
import { AlertCircle, AlertTriangle, X } from 'lucide-react'

interface ModalCancelarPostulacionProps {
    abierto: boolean
    onCerrar: () => void
    onConfirmar: (motivoBaja: string) => Promise<void>
    esAdmin?: boolean
    identificadorFelino: string
    nombrePostulante?: string
}

export default function ModalCancelarPostulacion({
    abierto,
    onCerrar,
    onConfirmar,
    esAdmin = false,
    identificadorFelino,
    nombrePostulante,
}: ModalCancelarPostulacionProps) {
    const [motivoBaja, setMotivoBaja] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [enviando, setEnviando] = useState(false)

    useEffect(() => {
        if (abierto) {
            setMotivoBaja('')
            setError(null)
            setEnviando(false)
        }
    }, [abierto])

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !enviando) onCerrar()
        }
        if (abierto) window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [abierto, enviando, onCerrar])

    if (!abierto) return null

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)

        if (!motivoBaja.trim()) {
            setError('Debes indicar el motivo de cancelación antes de confirmar.')
            return
        }

        setEnviando(true)
        try {
            await onConfirmar(motivoBaja.trim())
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo cancelar la solicitud.')
        } finally {
            setEnviando(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-marino/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-cancelar-titulo"
        >
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-beige">
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-3 border-b border-beige/50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-700">
                            <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 id="modal-cancelar-titulo" className="font-heading text-lg font-bold text-marino">
                                {esAdmin ? 'Dar de baja postulación' : 'Cancelar solicitud de adopción'}
                            </h2>
                            <p className="text-xs text-marino/65">
                                Felino: <strong className="text-marino">{identificadorFelino}</strong>
                                {esAdmin && nombrePostulante ? ` · ${nombrePostulante}` : ''}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={enviando}
                        onClick={onCerrar}
                        aria-label="Cerrar modal"
                        className="rounded-lg p-1.5 text-marino/60 hover:bg-crema hover:text-marino cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div className="rounded-xl bg-crema/80 p-3.5 text-xs leading-relaxed text-marino/80 ring-1 ring-beige/70">
                        Esta acción es irreversible. Al cancelar la solicitud, pasará a estado{' '}
                        <strong className="text-red-700">CANCELADA</strong> y el felino volverá a estar disponible para adopción en el catálogo público.
                    </div>

                    <div>
                        <label htmlFor="motivoBaja" className="block text-sm font-semibold text-marino mb-1.5">
                            Motivo de cancelación <span className="text-cafe">*</span>
                        </label>
                        <textarea
                            id="motivoBaja"
                            rows={3}
                            maxLength={300}
                            placeholder={
                                esAdmin
                                    ? 'Ej. Incumplimiento de requisitos de seguridad en vivienda o desistimiento del postulante...'
                                    : 'Ej. Cambio de domicilio, motivos familiares o decisión personal...'
                            }
                            value={motivoBaja}
                            onChange={(e) => setMotivoBaja(e.target.value)}
                            className="w-full rounded-xl border border-beige bg-white p-3 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                        />
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs font-medium text-red-800 ring-1 ring-red-200"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="flex items-center justify-end gap-3 border-t border-beige/50 pt-4">
                        <button
                            type="button"
                            disabled={enviando}
                            onClick={onCerrar}
                            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-marino/75 hover:bg-crema hover:text-marino cursor-pointer"
                        >
                            Volver
                        </button>
                        <button
                            type="submit"
                            disabled={enviando}
                            className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-70 cursor-pointer"
                        >
                            {enviando ? 'Cancelando...' : 'Confirmar cancelación'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}