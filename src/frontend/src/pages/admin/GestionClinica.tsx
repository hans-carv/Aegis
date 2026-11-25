// src/pages/admin/GestionClinica.tsx
import { useEffect, useState, useMemo } from 'react';
import { obtenerTodosLosGatos, type GatoCompleto } from '../../services/catsService';
import ModalExpedienteClinico from '../../components/ModalExpedienteClinico';
import {
  Stethoscope,
  Search,
  Filter,
} from 'lucide-react';
import teoFoto from '../../assets/teo.jfif';

export default function GestionClinica() {
  const [felinos, setFelinos] = useState<GatoCompleto[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [busqueda, setBusqueda] = useState('');
  const [filtroEstadoMedico, setFiltroEstadoMedico] = useState<string>('TODOS');
  const [gatoSeleccionado, setGatoSeleccionado] = useState<GatoCompleto | null>(null);

  async function cargarFelinos() {
    setCargando(true);
    setError(null);
    try {
      const data = await obtenerTodosLosGatos();
      setFelinos(data);
    } catch (err: any) {
      setError(err.message || 'Error al obtener la lista de felinos');
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarFelinos();
  }, []);

  const felinosFiltrados = useMemo(() => {
    return felinos.filter((gato) => {
      const matchBusqueda =
        gato.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        gato.codigoFelino.toLowerCase().includes(busqueda.toLowerCase());

      if (!matchBusqueda) return false;

      // Note: `gato` might have properties or we filter by general state
      if (filtroEstadoMedico === 'TODOS') return true;
      if (filtroEstadoMedico === 'CUARENTENA') return gato.estado === 'CUARENTENA';
      if (filtroEstadoMedico === 'DISPONIBLE') return gato.estado === 'DISPONIBLE';

      return true;
    });
  }, [felinos, busqueda, filtroEstadoMedico]);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-marino sm:text-3xl flex items-center gap-2">
            <Stethoscope className="h-8 w-8 text-marino" />
            Gestión Clínica e Inmunizaciones
          </h1>
          <p className="font-sans text-sm text-marino/75">
            Control de esterilización, pruebas virales (VIF/ViLeF), tratamientos y calendario de vacunas/desparasitación.
          </p>
        </div>

        <button
          type="button"
          onClick={cargarFelinos}
          className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-xl bg-marino px-4 py-2.5 text-xs font-semibold text-crema shadow-sm hover:bg-marino/90 transition cursor-pointer"
        >
          Actualizar Listado
        </button>
      </header>

      {/* Barra de Filtros y Búsqueda */}
      <section className="flex flex-col sm:flex-row gap-3 rounded-2xl border border-beige/80 bg-white p-4 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-marino/40" />
          <input
            type="text"
            placeholder="Buscar felino por nombre o código único..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full rounded-xl border border-beige/80 bg-crema/20 py-2 pl-9 pr-4 text-xs text-marino placeholder:text-marino/40 focus:ring-2 focus:ring-marino outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-marino/60" />
          <select
            value={filtroEstadoMedico}
            onChange={(e) => setFiltroEstadoMedico(e.target.value)}
            className="rounded-xl border border-beige/80 bg-crema/20 py-2 px-3 text-xs text-marino font-medium outline-hidden"
          >
            <option value="TODOS">Todos los estados operativos</option>
            <option value="CUARENTENA">En Cuarentena / Tratamiento</option>
            <option value="DISPONIBLE">Disponibles en Cafetería</option>
          </select>
        </div>
      </section>

      {/* Contenido principal */}
      {cargando && (
        <div className="flex h-64 w-full flex-col items-center justify-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-3 border-celeste border-t-marino" />
          <p className="font-sans text-sm text-marino/70">Cargando datos clínicos de los felinos...</p>
        </div>
      )}

      {!cargando && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      {!cargando && !error && felinosFiltrados.length === 0 && (
        <div className="rounded-2xl border border-dashed border-beige bg-white/50 p-12 text-center text-marino/60 text-sm">
          No se encontraron felinos que coincidan con los criterios de búsqueda.
        </div>
      )}

      {!cargando && !error && felinosFiltrados.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {felinosFiltrados.map((gato) => (
            <article
              key={gato.id || gato.codigoFelino}
              className="flex flex-col justify-between overflow-hidden rounded-2xl bg-white border border-beige/80 shadow-xs hover:shadow-md transition"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <img
                    src={gato.fotoUrl || gato.foto_url || teoFoto}
                    alt={gato.nombre}
                    className="h-16 w-16 rounded-xl object-cover ring-1 ring-beige"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = teoFoto;
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h3 className="font-heading text-lg font-bold text-marino truncate">
                        {gato.nombre}
                      </h3>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-marino/10 text-marino font-bold">
                        {gato.codigoFelino}
                      </span>
                    </div>
                    <p className="text-xs text-marino/70">
                      {gato.sexo === 'HEMBRA' ? '♀ Hembra' : '♂ Macho'} · {gato.edadMeses} meses
                    </p>
                    <div className="mt-1">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          gato.estado === 'CUARENTENA'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {gato.estado}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-crema/30 p-3 text-xs space-y-1 text-marino/80">
                  <div className="flex justify-between">
                    <span className="font-semibold text-cafe">Módulo Clínico:</span>
                    <span className="font-bold text-marino">Expediente habilitado</span>
                  </div>
                  <p className="text-[11px] text-marino/70">
                    Consulta castración, historial de pruebas VIF/ViLeF y calendario de vacunas.
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  type="button"
                  onClick={() => setGatoSeleccionado(gato)}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-marino py-2.5 px-4 text-xs font-semibold text-crema hover:bg-marino/90 transition shadow-xs cursor-pointer"
                >
                  <Stethoscope className="h-4 w-4" />
                  <span>Ver Expediente Clínico</span>
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Modal Clínico */}
      {gatoSeleccionado && (
        <ModalExpedienteClinico
          gatoId={gatoSeleccionado.id}
          nombreGato={gatoSeleccionado.nombre}
          codigoFelino={gatoSeleccionado.codigoFelino}
          onClose={() => setGatoSeleccionado(null)}
          onActualizado={() => cargarFelinos()}
        />
      )}
    </div>
  );
}
