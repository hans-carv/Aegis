// src/components/ModalExpedienteClinico.tsx
import { useState, useEffect } from 'react';
import {
  obtenerExpedienteClinico,
  registrarTratamientoClinico,
  obtenerInmunizaciones,
  registrarInmunizacion,
} from '../services/clinicoService';
import type {
  ExpedienteClinicoData,
  ControlInmunologicoRegistro,
  TipoProcedimientoClinico,
  TipoControlInmunologico,
  ResultadoViral,
  EstadoMedico,
} from '../types/clinico';
import {
  X,
  Stethoscope,
  Syringe,
  AlertCircle,
  CheckCircle2,
  Calendar,
  PlusCircle,
  ShieldAlert,
} from 'lucide-react';

interface ModalExpedienteClinicoProps {
  gatoId: string;
  nombreGato: string;
  codigoFelino: string;
  onClose: () => void;
  onActualizado?: () => void;
}

export default function ModalExpedienteClinico({
  gatoId,
  nombreGato,
  codigoFelino,
  onClose,
  onActualizado,
}: ModalExpedienteClinicoProps) {
  const [tabActiva, setTabActiva] = useState<'TRATAMIENTOS' | 'INMUNIZACIONES'>('TRATAMIENTOS');
  const [cargando, setCargando] = useState(true);
  const [errorGlobal, setErrorGlobal] = useState<string | null>(null);

  const [expediente, setExpediente] = useState<ExpedienteClinicoData | null>(null);
  const [inmunizaciones, setInmunizaciones] = useState<ControlInmunologicoRegistro[]>([]);

  // Formulario Tratamiento Clínico
  const [mostrarFormTratamiento, setMostrarFormTratamiento] = useState(false);
  const [tipoProcedimiento, setTipoProcedimiento] = useState<TipoProcedimientoClinico>('CASTRACION');
  const [diagnostico, setDiagnostico] = useState('');
  const [descripcionTratamiento, setDescripcionTratamiento] = useState('');
  const [esEsterilizacion, setEsEsterilizacion] = useState(true);
  const [resultadoVif, setResultadoVif] = useState<ResultadoViral>('NEGATIVO');
  const [resultadoVilef, setResultadoVilef] = useState<ResultadoViral>('NEGATIVO');
  const [estadoMedico, setEstadoMedico] = useState<EstadoMedico>('SANO');
  const [requiereAislamiento, setRequiereAislamiento] = useState(false);
  const [veterinarioTratamiento, setVeterinarioTratamiento] = useState('');
  const [guardandoTratamiento, setGuardandoTratamiento] = useState(false);
  const [errorFormTratamiento, setErrorFormTratamiento] = useState<string | null>(null);

  // Formulario Inmunización
  const [mostrarFormInmunizacion, setMostrarFormInmunizacion] = useState(false);
  const [tipoControl, setTipoControl] = useState<TipoControlInmunologico>('VACUNA');
  const [nombreBiologico, setNombreBiologico] = useState('');
  const [fechaAplicacion, setFechaAplicacion] = useState(new Date().toISOString().split('T')[0]);
  const [fechaProximoRefuerzo, setFechaProximoRefuerzo] = useState('');
  const [lote, setLote] = useState('');
  const [veterinarioInmunizacion, setVeterinarioInmunizacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [guardandoInmunizacion, setGuardandoInmunizacion] = useState(false);
  const [errorFormInmunizacion, setErrorFormInmunizacion] = useState<string | null>(null);

  async function cargarDatos() {
    setCargando(true);
    setErrorGlobal(null);
    try {
      const [expRes, inmRes] = await Promise.all([
        obtenerExpedienteClinico(gatoId),
        obtenerInmunizaciones(gatoId),
      ]);
      setExpediente(expRes);
      setInmunizaciones(inmRes);
    } catch (err: any) {
      setErrorGlobal(err.message || 'Error al cargar el historial clínico');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarDatos();
  }, [gatoId]);

  // Actualizar checkbox de esterilización al cambiar de tipo de procedimiento
  useEffect(() => {
    if (tipoProcedimiento === 'CASTRACION') {
      setEsEsterilizacion(true);
    }
  }, [tipoProcedimiento]);

  async function handleGuardarTratamiento(e: React.FormEvent) {
    e.preventDefault();
    setErrorFormTratamiento(null);

    if (!diagnostico.trim() || !descripcionTratamiento.trim() || !veterinarioTratamiento.trim()) {
      setErrorFormTratamiento('Por favor completa todos los campos obligatorios.');
      return;
    }

    setGuardandoTratamiento(true);
    try {
      await registrarTratamientoClinico(gatoId, {
        tipoProcedimiento,
        diagnostico: diagnostico.trim(),
        descripcionTratamiento: descripcionTratamiento.trim(),
        esEsterilizacion: tipoProcedimiento === 'CASTRACION' ? true : esEsterilizacion,
        resultadoVif,
        resultadoVilef,
        estadoMedico,
        requiereAislamientoOCritico: requiereAislamiento,
        veterinarioResponsable: veterinarioTratamiento.trim(),
      });

      // Limpiar y recargar
      setDiagnostico('');
      setDescripcionTratamiento('');
      setVeterinarioTratamiento('');
      setMostrarFormTratamiento(false);
      await cargarDatos();
      onActualizado?.();
    } catch (err: any) {
      setErrorFormTratamiento(err.message || 'Error al guardar el procedimiento clínico');
    } finally {
      setGuardandoTratamiento(false);
    }
  }

  async function handleGuardarInmunizacion(e: React.FormEvent) {
    e.preventDefault();
    setErrorFormInmunizacion(null);

    if (!nombreBiologico.trim() || !fechaAplicacion || !fechaProximoRefuerzo) {
      setErrorFormInmunizacion('El nombre biológico y las fechas son obligatorios.');
      return;
    }

    if (new Date(fechaProximoRefuerzo) <= new Date(fechaAplicacion)) {
      setErrorFormInmunizacion('La fecha de refuerzo debe ser estrictamente posterior a la de aplicación.');
      return;
    }

    setGuardandoInmunizacion(true);
    try {
      await registrarInmunizacion(gatoId, {
        tipoControl,
        nombreBiologico: nombreBiologico.trim(),
        fechaAplicacion,
        fechaProximoRefuerzo,
        lote: lote.trim() || undefined,
        veterinarioResponsable: veterinarioInmunizacion.trim() || undefined,
        observaciones: observaciones.trim() || undefined,
      });

      // Limpiar y recargar
      setNombreBiologico('');
      setFechaProximoRefuerzo('');
      setLote('');
      setVeterinarioInmunizacion('');
      setObservaciones('');
      setMostrarFormInmunizacion(false);
      await cargarDatos();
      onActualizado?.();
    } catch (err: any) {
      setErrorFormInmunizacion(err.message || 'Error al guardar el control inmunológico');
    } finally {
      setGuardandoInmunizacion(false);
    }
  }

  const ficha = expediente?.fichaSanitaria;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-beige/80 flex flex-col max-h-[90vh]">
        {/* Encabezado */}
        <header className="flex items-center justify-between border-b border-beige/60 p-5 bg-crema/40 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-celeste/40 text-marino">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-xl font-bold text-marino">{nombreGato}</h2>
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-marino text-crema">
                  {codigoFelino}
                </span>
              </div>
              <p className="text-xs text-marino/75">
                Expediente Clínico, Castración e Inmunizaciones (Sprint 3)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-marino/60 hover:bg-black/5 hover:text-marino transition"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Resumen Ficha Sanitaria */}
        {ficha && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-crema/20 border-b border-beige/40 text-xs">
            <div className="rounded-xl bg-white p-3 border border-beige/60 shadow-xs">
              <span className="text-gray-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                Castración / Esterilizado
              </span>
              <span
                className={`inline-flex items-center gap-1 font-bold ${
                  ficha.esterilizado ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {ficha.esterilizado ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Sí (Esterilizado)
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" /> Pendiente
                  </>
                )}
              </span>
            </div>

            <div className="rounded-xl bg-white p-3 border border-beige/60 shadow-xs">
              <span className="text-gray-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                Resultado VIF
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  ficha.resultadoVif === 'POSITIVO'
                    ? 'bg-red-100 text-red-700'
                    : ficha.resultadoVif === 'NEGATIVO'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {ficha.resultadoVif || 'NO_REALIZADO'}
              </span>
            </div>

            <div className="rounded-xl bg-white p-3 border border-beige/60 shadow-xs">
              <span className="text-gray-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                Resultado ViLeF
              </span>
              <span
                className={`inline-block px-2 py-0.5 rounded-full font-bold text-[11px] ${
                  ficha.resultadoVilef === 'POSITIVO'
                    ? 'bg-red-100 text-red-700'
                    : ficha.resultadoVilef === 'NEGATIVO'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {ficha.resultadoVilef || 'NO_REALIZADO'}
              </span>
            </div>

            <div className="rounded-xl bg-white p-3 border border-beige/60 shadow-xs">
              <span className="text-gray-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">
                Estado Médico y Cuarentena
              </span>
              <span
                className={`inline-flex items-center gap-1 font-bold ${
                  ficha.estadoMedico === 'SANO'
                    ? 'text-emerald-700'
                    : ficha.estadoMedico === 'AISLAMIENTO'
                    ? 'text-red-700'
                    : 'text-amber-700'
                }`}
              >
                {ficha.estadoMedico === 'AISLAMIENTO' && <ShieldAlert className="h-4 w-4" />}
                {ficha.estadoMedico} ({ficha.estado})
              </span>
            </div>
          </div>
        )}

        {/* Pestañas */}
        <div className="flex border-b border-beige/60 px-5 pt-3 gap-2 bg-crema/10">
          <button
            type="button"
            onClick={() => setTabActiva('TRATAMIENTOS')}
            className={`flex items-center gap-2 pb-3 px-3 font-semibold text-sm transition border-b-2 cursor-pointer ${
              tabActiva === 'TRATAMIENTOS'
                ? 'border-marino text-marino'
                : 'border-transparent text-marino/60 hover:text-marino'
            }`}
          >
            <Stethoscope className="h-4 w-4" />
            <span>Tratamientos y Cirugías ({expediente?.historialClinico.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setTabActiva('INMUNIZACIONES')}
            className={`flex items-center gap-2 pb-3 px-3 font-semibold text-sm transition border-b-2 cursor-pointer ${
              tabActiva === 'INMUNIZACIONES'
                ? 'border-marino text-marino'
                : 'border-transparent text-marino/60 hover:text-marino'
            }`}
          >
            <Syringe className="h-4 w-4" />
            <span>Vacunas y Desparasitaciones ({inmunizaciones.length})</span>
          </button>
        </div>

        {/* Contenido Scrolleable */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {cargando && (
            <div className="py-12 text-center text-marino/70">
              <div className="h-8 w-8 animate-spin rounded-full border-3 border-celeste border-t-marino mx-auto mb-2" />
              Cargando expediente clínico...
            </div>
          )}

          {errorGlobal && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
              {errorGlobal}
            </div>
          )}

          {!cargando && !errorGlobal && tabActiva === 'TRATAMIENTOS' && (
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-base text-marino">
                  Procedimientos Médicos Realizados
                </h3>
                <button
                  type="button"
                  onClick={() => setMostrarFormTratamiento(!mostrarFormTratamiento)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-marino px-3 py-2 text-xs font-semibold text-crema hover:bg-marino/90 transition cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  {mostrarFormTratamiento ? 'Cancelar' : 'Registrar Procedimiento'}
                </button>
              </div>

              {/* Formulario Nuevo Procedimiento */}
              {mostrarFormTratamiento && (
                <form
                  onSubmit={handleGuardarTratamiento}
                  className="rounded-2xl border border-beige bg-crema/20 p-5 space-y-4 text-sm"
                >
                  <h4 className="font-bold text-marino border-b border-beige/60 pb-2">
                    Nuevo Procedimiento Clínico o Cirugía
                  </h4>

                  {errorFormTratamiento && (
                    <div className="rounded-lg bg-red-100 p-3 text-xs text-red-800">
                      {errorFormTratamiento}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-marino mb-1">
                        Tipo de Procedimiento *
                      </label>
                      <select
                        value={tipoProcedimiento}
                        onChange={(e) => setTipoProcedimiento(e.target.value as TipoProcedimientoClinico)}
                        className="w-full rounded-xl border border-beige bg-white p-2.5 text-xs text-marino focus:ring-2 focus:ring-marino outline-hidden"
                      >
                        <option value="CASTRACION">Castración / Esterilización</option>
                        <option value="PRUEBA_VIRAL">Prueba Viral (VIF / ViLeF)</option>
                        <option value="TRATAMIENTO_FARMACOLOGICO">Tratamiento Farmacológico</option>
                        <option value="CIRUGIA_GENERAL">Cirugía General</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-marino mb-1">
                        Veterinario Responsable *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Dr. Carlos Méndez"
                        value={veterinarioTratamiento}
                        onChange={(e) => setVeterinarioTratamiento(e.target.value)}
                        className="w-full rounded-xl border border-beige bg-white p-2.5 text-xs text-marino focus:ring-2 focus:ring-marino outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-marino mb-1">
                      Diagnóstico Clínico *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Chequeo de ingreso / Apto para esterilización"
                      value={diagnostico}
                      onChange={(e) => setDiagnostico(e.target.value)}
                      className="w-full rounded-xl border border-beige bg-white p-2.5 text-xs text-marino focus:ring-2 focus:ring-marino outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-marino mb-1">
                      Descripción del Tratamiento / Intervención *
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Detalles quirúrgicos, medicamentos o resultados del test..."
                      value={descripcionTratamiento}
                      onChange={(e) => setDescripcionTratamiento(e.target.value)}
                      className="w-full rounded-xl border border-beige bg-white p-2.5 text-xs text-marino focus:ring-2 focus:ring-marino outline-hidden"
                      required
                    />
                  </div>

                  {/* Opciones avanzadas y resultados */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-beige/40">
                    <div>
                      <label className="block text-xs font-semibold text-marino mb-1">
                        Resultado VIF
                      </label>
                      <select
                        value={resultadoVif}
                        onChange={(e) => setResultadoVif(e.target.value as ResultadoViral)}
                        className="w-full rounded-xl border border-beige bg-white p-2 text-xs"
                      >
                        <option value="NEGATIVO">Negativo</option>
                        <option value="POSITIVO">Positivo</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="NO_REALIZADO">No realizado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-marino mb-1">
                        Resultado ViLeF
                      </label>
                      <select
                        value={resultadoVilef}
                        onChange={(e) => setResultadoVilef(e.target.value as ResultadoViral)}
                        className="w-full rounded-xl border border-beige bg-white p-2 text-xs"
                      >
                        <option value="NEGATIVO">Negativo</option>
                        <option value="POSITIVO">Positivo</option>
                        <option value="PENDIENTE">Pendiente</option>
                        <option value="NO_REALIZADO">No realizado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-marino mb-1">
                        Estado Médico Resultante
                      </label>
                      <select
                        value={estadoMedico}
                        onChange={(e) => setEstadoMedico(e.target.value as EstadoMedico)}
                        className="w-full rounded-xl border border-beige bg-white p-2 text-xs"
                      >
                        <option value="SANO">Sano (Apto sala común)</option>
                        <option value="EN_TRATAMIENTO">En Tratamiento (Pasa a cuarentena)</option>
                        <option value="AISLAMIENTO">Aislamiento Crítico</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-marino cursor-pointer">
                      <input
                        type="checkbox"
                        checked={esEsterilizacion}
                        onChange={(e) => setEsEsterilizacion(e.target.checked)}
                        className="rounded text-marino focus:ring-marino"
                      />
                      Marca definitiva como felino esterilizado/castrado
                    </label>

                    <label className="flex items-center gap-2 text-xs font-semibold text-red-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={requiereAislamiento}
                        onChange={(e) => setRequiereAislamiento(e.target.checked)}
                        className="rounded text-red-600 focus:ring-red-600"
                      />
                      Requiere aislamiento médico / cuarentena estricta
                    </label>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={guardandoTratamiento}
                      className="rounded-xl bg-marino px-5 py-2.5 font-semibold text-crema hover:bg-marino/90 disabled:opacity-50 text-xs cursor-pointer shadow-sm"
                    >
                      {guardandoTratamiento ? 'Guardando...' : 'Guardar Procedimiento'}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Procedimientos Históricos */}
              {expediente?.historialClinico.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-beige p-8 text-center text-marino/60 text-xs">
                  No hay procedimientos clínicos registrados para este felino.
                </div>
              ) : (
                <div className="space-y-3">
                  {expediente?.historialClinico.map((item) => (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-beige/80 bg-white p-4 shadow-xs space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-beige/40 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-marino">
                            {item.tipoProcedimiento.replace('_', ' ')}
                          </span>
                          {item.esEsterilizacion && (
                            <span className="rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
                              Esterilizado
                            </span>
                          )}
                          {item.requiereAislamientoOCritico && (
                            <span className="rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-[10px] font-bold">
                              Aislamiento
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 font-mono text-[11px]">
                          {new Date(item.fechaRegistro).toLocaleDateString()} {new Date(item.fechaRegistro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-marino">
                        <strong className="text-cafe">Diagnóstico:</strong> {item.diagnostico}
                      </p>
                      <p className="text-marino/80">
                        <strong className="text-cafe">Tratamiento:</strong> {item.descripcionTratamiento}
                      </p>

                      <div className="flex flex-wrap items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                        <span>
                          Veterinario: <strong>{item.veterinarioResponsable}</strong>
                        </span>
                        {item.administradorResponsable && (
                          <span>Registrado por: {item.administradorResponsable}</span>
                        )}
                        <span>
                          Estado resultante: <strong className="text-marino">{item.estadoMedicoResultante}</strong>
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          )}

          {!cargando && !errorGlobal && tabActiva === 'INMUNIZACIONES' && (
            <section className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-bold text-base text-marino">
                  Control Inmunológico (Vacunas y Desparasitaciones)
                </h3>
                <button
                  type="button"
                  onClick={() => setMostrarFormInmunizacion(!mostrarFormInmunizacion)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-marino px-3 py-2 text-xs font-semibold text-crema hover:bg-marino/90 transition cursor-pointer"
                >
                  <PlusCircle className="h-4 w-4" />
                  {mostrarFormInmunizacion ? 'Cancelar' : 'Registrar Inmunización'}
                </button>
              </div>

              {/* Formulario Nueva Inmunización */}
              {mostrarFormInmunizacion && (
                <form
                  onSubmit={handleGuardarInmunizacion}
                  className="rounded-2xl border border-beige bg-crema/20 p-5 space-y-4 text-sm"
                >
                  <h4 className="font-bold text-marino border-b border-beige/60 pb-2">
                    Registrar Vacuna o Desparasitación
                  </h4>

                  {errorFormInmunizacion && (
                    <div className="rounded-lg bg-red-100 p-3 text-xs text-red-800">
                      {errorFormInmunizacion}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-marino mb-1">
                        Tipo de Control *
                      </label>
                      <select
                        value={tipoControl}
                        onChange={(e) => setTipoControl(e.target.value as TipoControlInmunologico)}
                        className="w-full rounded-xl border border-beige bg-white p-2.5 text-xs text-marino focus:ring-2 focus:ring-marino outline-hidden"
                      >
                        <option value="VACUNA">Vacuna</option>
                        <option value="DESPARASITACION">Desparasitación</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-marino mb-1">
                        Nombre del Biológico / Fármaco *
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Triple Felina / Drontal / Rabia"
                        value={nombreBiologico}
                        onChange={(e) => setNombreBiologico(e.target.value)}
                        className="w-full rounded-xl border border-beige bg-white p-2.5 text-xs text-marino focus:ring-2 focus:ring-marino outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-marino mb-1">
                        Fecha de Aplicación *
                      </label>
                      <input
                        type="date"
                        value={fechaAplicacion}
                        onChange={(e) => setFechaAplicacion(e.target.value)}
                        className="w-full rounded-xl border border-beige bg-white p-2.5 text-xs text-marino focus:ring-2 focus:ring-marino outline-hidden"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-marino mb-1">
                        Fecha de Próximo Refuerzo (Posterior) *
                      </label>
                      <input
                        type="date"
                        value={fechaProximoRefuerzo}
                        onChange={(e) => setFechaProximoRefuerzo(e.target.value)}
                        className="w-full rounded-xl border border-beige bg-white p-2.5 text-xs text-marino focus:ring-2 focus:ring-marino outline-hidden"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-marino mb-1">
                        Lote del Fármaco (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. LOT-2026-X88"
                        value={lote}
                        onChange={(e) => setLote(e.target.value)}
                        className="w-full rounded-xl border border-beige bg-white p-2.5 text-xs text-marino focus:ring-2 focus:ring-marino outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-marino mb-1">
                        Veterinario Responsable (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Dra. Camila Rojas"
                        value={veterinarioInmunizacion}
                        onChange={(e) => setVeterinarioInmunizacion(e.target.value)}
                        className="w-full rounded-xl border border-beige bg-white p-2.5 text-xs text-marino focus:ring-2 focus:ring-marino outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-marino mb-1">
                      Observaciones Clínicas (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Dosis suministrada, reacciones, etc."
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      className="w-full rounded-xl border border-beige bg-white p-2.5 text-xs text-marino focus:ring-2 focus:ring-marino outline-hidden"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={guardandoInmunizacion}
                      className="rounded-xl bg-marino px-5 py-2.5 font-semibold text-crema hover:bg-marino/90 disabled:opacity-50 text-xs cursor-pointer shadow-sm"
                    >
                      {guardandoInmunizacion ? 'Guardando...' : 'Guardar Inmunización'}
                    </button>
                  </div>
                </form>
              )}

              {/* Lista de Inmunizaciones */}
              {inmunizaciones.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-beige p-8 text-center text-marino/60 text-xs">
                  No se registran vacunas ni desparasitaciones para este felino.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-beige/80 bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-crema/40 text-marino font-semibold border-b border-beige/60">
                      <tr>
                        <th className="p-3">Tipo</th>
                        <th className="p-3">Biológico / Fármaco</th>
                        <th className="p-3">Aplicación</th>
                        <th className="p-3">Próximo Refuerzo</th>
                        <th className="p-3">Lote</th>
                        <th className="p-3">Veterinario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-beige/40">
                      {inmunizaciones.map((inm) => (
                        <tr key={inm.id} className="hover:bg-crema/10">
                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                inm.tipoControl === 'VACUNA'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {inm.tipoControl}
                            </span>
                          </td>
                          <td className="p-3 font-semibold text-marino">{inm.nombreBiologico}</td>
                          <td className="p-3 text-gray-600 font-mono">{inm.fechaAplicacion}</td>
                          <td className="p-3 font-mono font-bold text-amber-700">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {inm.fechaProximoRefuerzo}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500">{inm.lote || '—'}</td>
                          <td className="p-3 text-gray-600">{inm.veterinarioResponsable || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <footer className="flex justify-end p-4 border-t border-beige/60 bg-crema/20 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-marino px-4 py-2 text-xs font-semibold text-crema hover:bg-marino/90 transition cursor-pointer"
          >
            Cerrar Expediente
          </button>
        </footer>
      </div>
    </div>
  );
}
