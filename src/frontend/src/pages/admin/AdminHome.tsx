import { Link } from 'react-router'
import GatoCard, { type EstadoGato } from '../../components/GatoCard'
import teoFoto from '../../assets/teo.jfif'

type GatoDePrueba = {
  codigo: string
  nombre: string
  peso: number
  edadMeses: number
  temperamento: string
  estado: EstadoGato
  foto: string
}

/** Datos locales de prueba alineados con las props de GatoCard */
const GATOS_DE_PRUEBA: GatoDePrueba[] = [
  { codigo: 'CAT-001', nombre: 'Luna', peso: 3.2, edadMeses: 18, temperamento: 'Tranquila', estado: 'ADOPCION', foto: teoFoto },
  { codigo: 'CAT-002', nombre: 'Michi', peso: 2.8, edadMeses: 8, temperamento: 'Juguetón', estado: 'CUARENTENA', foto: teoFoto },
  { codigo: 'CAT-003', nombre: 'Coco', peso: 4.5, edadMeses: 36, temperamento: 'Sociable', estado: 'ADOPTADO', foto: teoFoto },
  { codigo: 'CAT-004', nombre: 'Nina', peso: 3.0, edadMeses: 24, temperamento: 'Tímida', estado: 'DISPONIBLE', foto: teoFoto },
]

export default function AdminHome() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
      <header>
        <h1 className="font-heading text-2xl font-semibold text-marino sm:text-3xl">
          ¡Bienvenida a Proyecto Teo!
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-marino/70 sm:text-base">
          Este es el espacio para coordinar el rescate y la adopción responsable de gatos:
          registra nuevos ingresos y da seguimiento a cada felino en acogida.
        </p>
      </header>

      {/* Accesos rápidos */}
      <section aria-labelledby="accesos-rapidos-titulo">
        <h2 id="accesos-rapidos-titulo" className="font-heading text-lg font-semibold text-marino">
          Accesos rápidos
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link
            to="/admin/ingresos"
            className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-[#D9C3A5]/70 transition hover:ring-[#A9D6E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D6E8]"
          >
            <p className="font-heading text-base font-semibold text-marino">Registrar ingresos</p>
            <p className="mt-1 text-sm text-marino/65">
              Anota la llegada de un gato rescatado o derivado.
            </p>
          </Link>
          <Link
            to="/admin/felinos"
            className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-[#D9C3A5]/70 transition hover:ring-[#A9D6E8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D6E8]"
          >
            <p className="font-heading text-base font-semibold text-marino">Dar de alta felinos</p>
            <p className="mt-1 text-sm text-marino/65">
              Completa la ficha de un gato para su seguimiento.
            </p>
          </Link>
        </div>
      </section>

      {/* Sección con las tarjetas recicladas */}
      <section aria-labelledby="gatos-prueba-titulo">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="gatos-prueba-titulo" className="font-heading text-lg font-semibold text-marino">
            Felinos en seguimiento
          </h2>
          <p className="text-xs font-semibold tracking-wide text-cafe uppercase">Datos de prueba</p>
        </div>

        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4" role="list">
          {GATOS_DE_PRUEBA.map((gato) => (
            <li key={gato.codigo}>
              <GatoCard
                codigoFelino={gato.codigo}
                nombre={gato.nombre}
                peso={gato.peso}
                edadMeses={gato.edadMeses}
                temperamento={gato.temperamento}
                estado={gato.estado}
                fotoUrl={gato.foto}
                modoPublico={false}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}