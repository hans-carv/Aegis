import { useEffect, useState, type SubmitEvent } from 'react'
import { AlertCircle, CalendarCheck, X } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { agendarVisitaDomiciliaria } from '../services/visitasDomiciliariasService'
import type { PostulacionAdmin } from '../types/postulacion'
import type { VisitaDomiciliaria } from '../types/visitaDomiciliaria'

interface ModalProgramarVisitaProps {
    abierto: boolean
    onCerrar: () => void
    postulacion: PostulacionAdmin
    onVisitaProgramada: (visita: VisitaDomiciliaria) => void
}

export default function ModalProgramarVisita({
    abierto,
    onCerrar,
    postulacion,
    onVisitaProgramada,
}: ModalProgramarVisitaProps) {
    const { usuario } = useAuth()

    const [evaluadorId, setEvaluadorId] = useState('')
    const [fechaVisita, setFechaVisita] = useState('')
    const [horaInicio, setHoraInicio] = useState('10:00')
    const [horaFin, setHoraFin] = useState('11:00')
    const [direccionConfirmada, setDireccionConfirmada] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (abierto) {
            setEvaluadorId('')
            setFechaVisita('')
            setHoraInicio('10:00')
            setHoraFin('11:00')
            setDireccionConfirmada(postulacion.direccionDomicilio || '')
            setObservaciones('')
            setError(null)
        }
    }, [abierto, postulacion])

    if (!abierto) return null

    const hoyISO = new Date().toISOString().split('T')[0]

    async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
        e.preventDefault()
        setError(null)

        if (!fechaVisita || !horaInicio || !horaFin) {
            setError('Debes completar la fecha de visita, hora de inicio y hora de finalización.')
            return
        }

        if (horaFin <= horaInicio) {
            setError('La hora de finalización debe ser posterior a la hora de inicio.')
            return
        }

        setGuardando(true)
        try {
            const adminId = usuario?.id || ''
            const visita = await agendarVisitaDomiciliaria(adminId, {
                postulacionId: postulacion.id,
                ...(evaluadorId.trim() ? { evaluadorId: evaluadorId.trim() } : {}),
                fechaVisita,
                horaInicio,
                horaFin,
                direccionConfirmada: direccionConfirmada.trim(),
                observaciones: observaciones.trim(),
            })

            onVisitaProgramada({
                ...visita,
                postulanteNombre: postulacion.postulanteNombre,
                gatoNombre: postulacion.felinoNombre,
                gatoId: postulacion.gatoId,
                evidenciaAdecuacionesUrls: visita.evidenciaAdecuacionesUrls || [],
            })
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Ocurrió un error al programar la visita domiciliaria.'
            )
        } finally {
            setGuardando(false)
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-marino/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-visita-titulo"
        >
            <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-beige">
                <div className="flex items-start justify-between gap-3 border-b border-beige/50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marino text-crema">
                            <CalendarCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 id="modal-visita-titulo" className="font-heading text-lg font-bold text-marino">
                                Programar visita domiciliaria
                            </h2>
                            <p className="text-xs text-marino/65">
                                Postulante: <strong>{postulacion.postulanteNombre}</strong> · Felino:{' '}
                                <strong>{postulacion.felinoNombre}</strong>
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        disabled={guardando}
                        onClick={onCerrar}
                        aria-label="Cerrar modal"
                        className="rounded-lg p-1.5 text-marino/60 hover:bg-crema hover:text-marino cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                    <div>
                        <label htmlFor="evaluadorId" className="block text-xs font-bold text-marino mb-1">
                            Evaluador responsable
                        </label>
                        <select
                            id="evaluadorId"
                            value={evaluadorId}
                            onChange={(e) => setEvaluadorId(e.target.value)}
                            className="h-10 w-full rounded-xl border border-beige bg-white px-3 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                        >
                            <option value="">
                                {usuario?.nombre ? `${usuario.nombre} (Administradora actual)` : 'Administradora actual (Por defecto)'}
                            </option>
                        </select>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <div>
                            <label htmlFor="fechaVisita" className="block text-xs font-bold text-marino mb-1">
                                Fecha de visita <span className="text-cafe">*</span>
                            </label>
                            <input
                                id="fechaVisita"
                                type="date"
                                min={hoyISO}
                                value={fechaVisita}
                                onChange={(e) => setFechaVisita(e.target.value)}
                                className="h-10 w-full rounded-xl border border-beige bg-white px-3 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                            />
                        </div>

                        <div>
                            <label htmlFor="horaInicioVisita" className="block text-xs font-bold text-marino mb-1">
                                Hora inicio <span className="text-cafe">*</span>
                            </label>
                            <input
                                id="horaInicioVisita"
                                type="time"
                                value={horaInicio}
                                onChange={(e) => setHoraInicio(e.target.value)}
                                className="h-10 w-full rounded-xl border border-beige bg-white px-3 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                            />
                        </div>

                        <div>
                            <label htmlFor="horaFinVisita" className="block text-xs font-bold text-marino mb-1">
                                Hora fin <span className="text-cafe">*</span>
                            </label>
                            <input
                                id="horaFinVisita"
                                type="time"
                                value={horaFin}
                                onChange={(e) => setHoraFin(e.target.value)}
                                className="h-10 w-full rounded-xl border border-beige bg-white px-3 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="direccionConfirmada" className="block text-xs font-bold text-marino mb-1">
                            Dirección confirmada del domicilio <span className="text-cafe">*</span>
                        </label>
                        <input
                            id="direccionConfirmada"
                            type="text"
                            value={direccionConfirmada}
                            onChange={(e) => setDireccionConfirmada(e.target.value)}
                            className="h-10 w-full rounded-xl border border-beige bg-white px-3 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                        />
                        <p className="mt-1 text-[11px] text-marino/60">
                            Obtenida de la postulación. Puedes confirmarla o ajustarla con referencias exactas.
                        </p>
                    </div>

                    <div>
                        <label htmlFor="obsVisita" className="block text-xs font-bold text-marino mb-1">
                            Observaciones adicionales <span className="font-normal text-marino/60">(opcional)</span>
                        </label>
                        <textarea
                            id="obsVisita"
                            rows={2}
                            placeholder="Ej. Llamar 15 minutos antes de llegar, verificar mallas en balcón..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
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
                            disabled={guardando}
                            onClick={onCerrar}
                            className="rounded-xl px-4 py-2 text-sm font-semibold text-marino/75 hover:bg-crema cursor-pointer"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando}
                            className="rounded-xl bg-marino px-5 py-2.5 text-sm font-semibold text-crema hover:bg-marino/90 disabled:opacity-70 cursor-pointer"
                        >
                            {guardando ? 'Agendando...' : 'Confirmar visita'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}