import { Link } from 'react-router'
import teoFoto from '../../assets/teo.jfif'

type EstadoFelino = 'CUARENTENA' | 'ADOPCION' | 'ADOPTADO'

type GatoDePrueba = {
  id: string
  nombre: string
  edadMeses: number
  estado: EstadoFelino
  foto: string
}

/** Datos locales de prueba. No provienen de la API ni de persistencia real. */
const GATOS_DE_PRUEBA: GatoDePrueba[] = [
  { id: 'prueba-luna', nombre: 'Luna', edadMeses: 18, estado: 'ADOPCION', foto: teoFoto },
  { id: 'prueba-michi', nombre: 'Michi', edadMeses: 8, estado: 'CUARENTENA', foto: teoFoto },
  { id: 'prueba-coco', nombre: 'Coco', edadMeses: 36, estado: 'ADOPTADO', foto: teoFoto },
  { id: 'prueba-nina', nombre: 'Nina', edadMeses: 24, estado: 'ADOPCION', foto: teoFoto },
]

const ESTADO_ETIQUETA: Record<EstadoFelino, string> = {
  CUARENTENA: 'En cuarentena',
  ADOPCION: 'En adopción',
  ADOPTADO: 'Adoptado',
}

const ESTADO_ESTILO: Record<EstadoFelino, string> = {
  CUARENTENA: 'bg-beige text-cafe',
  ADOPCION: 'bg-celeste/70 text-marino',
  ADOPTADO: 'bg-marino text-crema',
}

function formatearEdad(edadMeses: number) {
  if (edadMeses < 12) {
    return `${edadMeses} ${edadMeses === 1 ? 'mes' : 'meses'}`
  }

  const anios = Math.floor(edadMeses / 12)
  const resto = edadMeses % 12
  if (resto === 0) {
    return `${anios} ${anios === 1 ? 'año' : 'años'}`
  }

  return `${anios} ${anios === 1 ? 'año' : 'años'} y ${resto} ${resto === 1 ? 'mes' : 'meses'}`
}

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

      <section aria-labelledby="accesos-rapidos-titulo">
        <h2 id="accesos-rapidos-titulo" className="font-heading text-lg font-semibold text-marino">
          Accesos rápidos
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Link
            to="/admin/ingresos"
            className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-beige/70 transition hover:ring-celeste focus-visible:ring-2 focus-visible:ring-celeste focus-visible:outline-none"
          >
            <p className="font-heading text-base font-semibold text-marino">Registrar ingresos</p>
            <p className="mt-1 text-sm text-marino/65">
              Anota la llegada de un gato rescatado o derivado.
            </p>
          </Link>
          <Link
            to="/admin/felinos"
            className="rounded-2xl bg-white p-5 shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-beige/70 transition hover:ring-celeste focus-visible:ring-2 focus-visible:ring-celeste focus-visible:outline-none"
          >
            <p className="font-heading text-base font-semibold text-marino">Dar de alta felinos</p>
            <p className="mt-1 text-sm text-marino/65">
              Completa la ficha de un gato para su seguimiento.
            </p>
          </Link>
        </div>
      </section>

      <section aria-labelledby="gatos-prueba-titulo">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="gatos-prueba-titulo" className="font-heading text-lg font-semibold text-marino">
            Felinos en seguimiento
          </h2>
          <p className="text-xs font-semibold tracking-wide text-cafe uppercase">Datos de prueba</p>
        </div>
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {GATOS_DE_PRUEBA.map((gato) => (
            <li
              key={gato.id}
              className="overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-beige/70"
            >
              <img
                src={gato.foto}
                alt={`Fotografía de prueba de ${gato.nombre}`}
                className="h-40 w-full object-cover"
              />
              <div className="flex flex-col gap-2 p-4">
                <p className="font-heading text-lg font-semibold text-marino">{gato.nombre}</p>
                <p className="text-sm text-marino/65">{formatearEdad(gato.edadMeses)}</p>
                <span
                  className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${ESTADO_ESTILO[gato.estado]}`}
                >
                  {ESTADO_ETIQUETA[gato.estado]}
                </span>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
