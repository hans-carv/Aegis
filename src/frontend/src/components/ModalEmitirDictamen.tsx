import { useEffect, useState, type FormEvent } from 'react'
import { AlertCircle, CheckCircle2, ClipboardCheck, Wrench, X, XCircle } from 'lucide-react'
import { emitirDictamenVisita } from '../services/visitasDomiciliariasService'
import type { DictamenVisita, VisitaDomiciliaria } from '../types/visitaDomiciliaria'

interface ModalEmitirDictamenProps {
    abierto: boolean
    onCerrar: () => void
    visita: VisitaDomiciliaria
    onDictamenEmitido: (visitaActualizada: VisitaDomiciliaria) => void
}

const OPCIONES_DICTAMEN: {
    valor: DictamenVisita
    titulo: string
    descripcion: string
    icono: typeof CheckCircle2
    colorActivo: string
}[] = [
        {
            valor: 'APROBADA',
            titulo: 'Aprobada',
            descripcion: 'El hogar cumple las condiciones. Habilita continuar hacia la formalización del contrato.',
            icono: CheckCircle2,
            colorActivo: 'border-green-600 bg-green-50/70 ring-2 ring-green-200',
        },
        {
            valor: 'PENDIENTE_ADECUACIONES',
            titulo: 'Pendiente de adecuaciones',
            descripcion: 'Requiere mejoras en el domicilio antes de aprobar. El postulante deberá adjuntar evidencias.',
            icono: Wrench,
            colorActivo: 'border-cafe bg-amber-50/80 ring-2 ring-beige',
        },
        {
            valor: 'RECHAZADA',
            titulo: 'Rechazada',
            descripcion: 'No cumple con los requisitos de seguridad. La solicitud se rechaza y el felino vuelve al catálogo.',
            icono: XCircle,
            colorActivo: 'border-red-600 bg-red-50/70 ring-2 ring-red-200',
        },
    ]

export default function ModalEmitirDictamen({
    abierto,
    onCerrar,
    visita,
    onDictamenEmitido,
}: ModalEmitirDictamenProps) {
    const [dictamen, setDictamen] = useState<DictamenVisita | ''>('')
    const [observaciones, setObservaciones] = useState('')
    const [diasPlazoSubsanacion, setDiasPlazoSubsanacion] = useState('7')

    // Lista de chequeo de inspección domiciliaria (SCRUM-84)
    const [checkMallas, setCheckMallas] = useState(false)
    const [checkBalcones, setCheckBalcones] = useState(false)
    const [checkEspacio, setCheckEspacio] = useState(false)

    const [error, setError] = useState<string | null>(null)
    const [guardando, setGuardando] = useState(false)

    useEffect(() => {
        if (abierto) {
            setDictamen('')
            setObservaciones('')
            setDiasPlazoSubsanacion('7')
            setCheckMallas(false)
            setCheckBalcones(false)
            setCheckEspacio(false)
            setError(null)
        }
    }, [abierto])

    if (!abierto) return null

    async function handleSubmit(e: FormEvent) {
        e.preventDefault()
        setError(null)

        if (!dictamen) {
            setError('Selecciona un dictamen de evaluación domiciliaria.')
            return
        }
        if (!observaciones.trim()) {
            setError('Las observaciones de la evaluación son obligatorias.')
            return
        }

        const resumenChecklist = `[Inspección: Mallas=${checkMallas ? 'OK' : 'Pendiente'}, Balcones/Ventanas=${checkBalcones ? 'OK' : 'Pendiente'}, Espacio=${checkEspacio ? 'OK' : 'Pendiente'}]`
        const observacionesCompletas = `${resumenChecklist} ${observaciones.trim()}`

        setGuardando(true)
        try {
            const dias =
                dictamen === 'PENDIENTE_ADECUACIONES' && diasPlazoSubsanacion
                    ? Number(diasPlazoSubsanacion)
                    : undefined

            const actualizada = await emitirDictamenVisita(visita.id, {
                dictamen,
                observaciones: observacionesCompletas,
                ...(dias ? { diasPlazoSubsanacion: dias } : {}),
            })

            onDictamenEmitido({
                ...visita,
                ...actualizada,
            })
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error inesperado al registrar el dictamen.'
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
            aria-labelledby="modal-dictamen-titulo"
        >
            <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-beige">
                <div className="flex items-start justify-between gap-3 border-b border-beige/50 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-marino text-crema">
                            <ClipboardCheck className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 id="modal-dictamen-titulo" className="font-heading text-lg font-bold text-marino">
                                Emitir dictamen de visita domiciliaria
                            </h2>
                            <p className="text-xs text-marino/65">
                                Visita del {visita.fechaVisita} ({visita.horaInicio} - {visita.horaFin})
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
                    {/* Lista de chequeo de inspección (SCRUM-84) */}
                    <div className="rounded-2xl bg-crema/60 p-4 ring-1 ring-beige">
                        <p className="mb-2.5 text-xs font-bold text-marino">
                            Lista de chequeo de inspección del domicilio
                        </p>
                        <div className="grid gap-2 sm:grid-cols-3 text-xs">
                            <label className="flex items-center gap-2 rounded-xl bg-white p-2.5 ring-1 ring-beige/70 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={checkMallas}
                                    onChange={(e) => setCheckMallas(e.target.checked)}
                                    className="h-4 w-4 rounded accent-marino"
                                />
                                <span className="font-medium text-marino">Mallas instaladas</span>
                            </label>

                            <label className="flex items-center gap-2 rounded-xl bg-white p-2.5 ring-1 ring-beige/70 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={checkBalcones}
                                    onChange={(e) => setCheckBalcones(e.target.checked)}
                                    className="h-4 w-4 rounded accent-marino"
                                />
                                <span className="font-medium text-marino">Balcones seguros</span>
                            </label>

                            <label className="flex items-center gap-2 rounded-xl bg-white p-2.5 ring-1 ring-beige/70 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={checkEspacio}
                                    onChange={(e) => setCheckEspacio(e.target.checked)}
                                    className="h-4 w-4 rounded accent-marino"
                                />
                                <span className="font-medium text-marino">Espacio adecuado</span>
                            </label>
                        </div>
                    </div>

                    {/* Selección de Dictamen */}
                    <div className="space-y-2.5">
                        <span className="block text-xs font-bold text-marino">
                            Resultado de la evaluación <span className="text-cafe">*</span>
                        </span>

                        {OPCIONES_DICTAMEN.map((op) => {
                            const Icon = op.icono
                            const seleccionado = dictamen === op.valor
                            return (
                                <button
                                    key={op.valor}
                                    type="button"
                                    onClick={() => setDictamen(op.valor)}
                                    className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-left transition cursor-pointer ${seleccionado
                                            ? op.colorActivo
                                            : 'border-beige/80 bg-crema/30 hover:bg-crema/70'
                                        }`}
                                >
                                    <Icon className="mt-0.5 h-5 w-5 shrink-0 text-marino" />
                                    <div>
                                        <p className="text-sm font-bold text-marino">{op.titulo}</p>
                                        <p className="text-xs text-marino/70">{op.descripcion}</p>
                                    </div>
                                </button>
                            )
                        })}
                    </div>

                    {dictamen === 'PENDIENTE_ADECUACIONES' && (
                        <div className="rounded-2xl bg-crema/70 p-4 ring-1 ring-beige">
                            <label htmlFor="diasPlazo" className="block text-xs font-bold text-marino mb-1">
                                Plazo de subsanación (en días)
                            </label>
                            <input
                                id="diasPlazo"
                                type="number"
                                min="1"
                                max="30"
                                value={diasPlazoSubsanacion}
                                onChange={(e) => setDiasPlazoSubsanacion(e.target.value)}
                                className="h-10 w-32 rounded-xl border border-beige bg-white px-3 text-sm text-marino outline-none focus:border-marino focus:ring-2 focus:ring-celeste"
                            />
                            <p className="mt-1 text-[11px] text-marino/65">
                                Si no se especifica un valor, el sistema asigna <strong>7 días</strong> calendario por defecto.
                            </p>
                        </div>
                    )}

                    <div>
                        <label htmlFor="obsDictamen" className="block text-xs font-bold text-marino mb-1">
                            Observaciones de la evaluación <span className="text-cafe">*</span>
                        </label>
                        <textarea
                            id="obsDictamen"
                            rows={3}
                            placeholder="Detalla las condiciones encontradas en el domicilio o las adecuaciones específicas requeridas..."
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
                            {guardando ? 'Guardando dictamen...' : 'Guardar dictamen'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}