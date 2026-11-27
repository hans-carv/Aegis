import { useEffect, useState } from 'react'
import { AlertCircle, Cat, ShieldAlert, ShieldCheck, Stethoscope, X } from 'lucide-react'
import { obtenerFichaAdministrativaGato } from '../services/adopcionesService'
import TarjetaPropietarioLegal from './TarjetaPropietarioLegal'
import type { FichaAdministrativaGato } from '../types/adopcion'

interface ModalFichaAdminGatoProps {
    gatoId: string
    nombreGato: string
    codigoFelino: string
    onCerrar: () => void
}

export default function ModalFichaAdminGato({
    gatoId,
    nombreGato,
    codigoFelino,
    onCerrar,
}: ModalFichaAdminGatoProps) {
    const [ficha, setFicha] = useState<FichaAdministrativaGato | null>(null)
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        setCargando(true)
        setError(null)
        obtenerFichaAdministrativaGato(gatoId)
            .then(setFicha)
            .catch((err) =>
                setError(
                    err instanceof Error
                        ? err.message
                        : 'No se pudo cargar la ficha administrativa del felino.'
                )
            )
            .finally(() => setCargando(false))
    }, [gatoId])

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-marino/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-ficha-admin-titulo"
        >
            <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-crema p-6 shadow-2xl ring-1 ring-beige space-y-5">
                {/* Cabecera */}
                <div className="flex items-start justify-between gap-3 border-b border-beige/60 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-marino text-crema">
                            <Cat className="h-6 w-6" />
                        </div>
                        <div>
                            <h2
                                id="modal-ficha-admin-titulo"
                                className="font-heading text-xl font-bold text-marino"
                            >
                                Ficha Administrativa · {nombreGato}
                            </h2>
                            <p className="text-xs font-semibold text-cafe">
                                Código Único: {codigoFelino}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onCerrar}
                        aria-label="Cerrar ficha administrativa"
                        className="rounded-xl p-1.5 text-marino/70 hover:bg-white hover:text-marino cursor-pointer"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {cargando ? (
                    <div className="flex h-40 flex-col items-center justify-center gap-2">
                        <div className="h-8 w-8 animate-spin rounded-full border-3 border-celeste border-t-marino" />
                        <p className="text-xs text-marino/75">Consultando ficha y tenencia legal...</p>
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200">
                        <AlertCircle className="h-5 w-5 shrink-0 text-red-600" />
                        <span>{error}</span>
                    </div>
                ) : ficha ? (
                    <div className="space-y-5">
                        {/* Resumen técnico y sanitario del felino */}
                        <div className="rounded-2xl bg-white p-4 ring-1 ring-beige/70">
                            <h3 className="mb-3 flex items-center gap-2 font-heading text-sm font-bold text-marino">
                                <Stethoscope className="h-4 w-4 text-cafe" />
                                Estado actual y perfil sanitario
                            </h3>
                            <div className="grid gap-3 sm:grid-cols-4 text-xs">
                                <div className="rounded-xl bg-crema/50 p-3 ring-1 ring-beige/60">
                                    <p className="font-semibold text-cafe">Estado en refugio</p>
                                    <p className="mt-1 font-bold text-marino">{ficha.felino.estado}</p>
                                </div>
                                <div className="rounded-xl bg-crema/50 p-3 ring-1 ring-beige/60">
                                    <p className="font-semibold text-cafe">Esterilización</p>
                                    <p className="mt-1 flex items-center gap-1 font-bold text-marino">
                                        {ficha.felino.esterilizado ? (
                                            <>
                                                <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
                                                Esterilizado/a
                                            </>
                                        ) : (
                                            <>
                                                <ShieldAlert className="h-3.5 w-3.5 text-amber-700" />
                                                Pendiente
                                            </>
                                        )}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-crema/50 p-3 ring-1 ring-beige/60">
                                    <p className="font-semibold text-cafe">Pruebas VIF / ViLeF</p>
                                    <p className="mt-1 font-bold text-marino">
                                        {ficha.felino.resultadoVif || 'NO_REALIZADO'} /{' '}
                                        {ficha.felino.resultadoVilef || 'NO_REALIZADO'}
                                    </p>
                                </div>
                                <div className="rounded-xl bg-crema/50 p-3 ring-1 ring-beige/60">
                                    <p className="font-semibold text-cafe">Estado médico</p>
                                    <p className="mt-1 font-bold text-marino">
                                        {ficha.felino.estadoMedico || 'SANO'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tarjeta Propietario / Adoptante Legal Actual (SCRUM-89) */}
                        {ficha.propietarioAdoptanteActual ? (
                            <TarjetaPropietarioLegal
                                propietario={ficha.propietarioAdoptanteActual}
                                codigoFelino={ficha.felino.codigoFelino}
                                gatoNombre={ficha.felino.nombre}
                                onContratoActualizado={(cambios) =>
                                    setFicha((prev) =>
                                        prev && prev.propietarioAdoptanteActual
                                            ? {
                                                  ...prev,
                                                  propietarioAdoptanteActual: {
                                                      ...prev.propietarioAdoptanteActual,
                                                      ...cambios,
                                                  },
                                              }
                                            : prev
                                    )
                                }
                            />
                        ) : (
                            <div className="rounded-2xl border-2 border-dashed border-beige bg-white/70 p-6 text-center">
                                <p className="font-heading text-base font-bold text-marino">
                                    Sin propietario legal asignado todavía
                                </p>
                                <p className="mt-1 text-xs text-marino/70">
                                    Este felino aún no tiene un vínculo formal de adopción vigente. Puedes
                                    formalizar su adopción desde una postulación con visita domiciliaria{' '}
                                    <strong>APROBADA</strong> en el módulo de Postulaciones.
                                </p>
                            </div>
                        )}
                    </div>
                ) : null}
            </div>
        </div>
    )
}
