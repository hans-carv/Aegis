import type { ReactNode } from 'react'

export type EstadoGato = 'CUARENTENA' | 'DISPONIBLE' | 'ADOPCION' | 'ADOPTADO'
export type SexoGato = 'MACHO' | 'HEMBRA'

export interface GatoCardProps {
    codigoFelino: string
    nombre: string
    peso: number
    talla?: string
    edadMeses: number
    temperamento?: string
    colorPelaje?: string
    sexo?: SexoGato
    estado: EstadoGato
    fotoUrl?: string
    historia?: string
    /** Si se activa el modo público, se muestra el botón "Adoptar" o de postulación */
    modoPublico?: boolean
    onAdoptar?: (codigoFelino: string) => void
    accionesAdmin?: ReactNode
}

const ESTADO_CONFIG: Record<EstadoGato, { etiqueta: string; estilo: string }> = {
    CUARENTENA: {
        etiqueta: 'En cuarentena',
        estilo: 'bg-[#D9C3A5] text-[#795548]',
    },
    DISPONIBLE: {
        etiqueta: 'Disponible',
        estilo: 'bg-[#A9D6E8] text-[#172641]',
    },
    ADOPCION: {
        etiqueta: 'En adopción',
        estilo: 'bg-[#A9D6E8]/70 text-[#172641]',
    },
    ADOPTADO: {
        etiqueta: 'Adoptado',
        estilo: 'bg-[#172641] text-[#FAF7F0]',
    },
}

export function formatearEdad(edadMeses: number): string {
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

export default function GatoCard({
    codigoFelino,
    nombre,
    peso,
    talla,
    edadMeses,
    temperamento,
    colorPelaje,
    sexo,
    estado,
    fotoUrl,
    historia,
    modoPublico = false,
    onAdoptar,
    accionesAdmin,
}: GatoCardProps) {
    const infoEstado = ESTADO_CONFIG[estado] || ESTADO_CONFIG.CUARENTENA

    return (
        <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_10px_30px_rgba(23,38,65,0.06)] ring-1 ring-[#D9C3A5]/60 transition-all hover:shadow-md">
            {/* Imagen / Placeholder */}
            <div className="relative h-48 w-full overflow-hidden bg-crema">
                {fotoUrl ? (
                    <img
                        src={fotoUrl}
                        alt={`Fotografía de ${nombre}`}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex h-full flex-col items-center justify-center gap-2 text-marino/40">
                        <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M12 5c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7Z" />
                            <circle cx="9" cy="11" r="1" fill="currentColor" />
                            <circle cx="15" cy="11" r="1" fill="currentColor" />
                        </svg>
                        <span className="text-xs font-semibold">Sin imagen</span>
                    </div>
                )}

                {/* Badge de Código y Estado */}
                <div className="absolute top-3 right-3 left-3 flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-marino/80 px-2.5 py-1 text-xs font-mono font-bold text-crema backdrop-blur-xs">
                        {codigoFelino}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold shadow-xs ${infoEstado.estilo}`}>
                        {infoEstado.etiqueta}
                    </span>
                </div>
            </div>

            {/* Cuerpo de la tarjeta */}
            <div className="flex flex-1 flex-col justify-between p-5">
                <div className="space-y-3">
                    <div className="flex items-baseline justify-between">
                        <h3 className="font-heading text-xl font-bold text-marino">{nombre}</h3>
                        {sexo && (
                            <span className={`text-xs font-bold ${sexo === 'HEMBRA' ? 'text-pink-600' : 'text-blue-600'}`}>
                                {sexo === 'HEMBRA' ? '♀ Hembra' : '♂ Macho'}
                            </span>
                        )}
                    </div>

                    {/* Ficha técnica abreviada */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-marino/80">
                        <div className="rounded-lg bg-crema p-2">
                            <span className="block text-[10px] uppercase tracking-wider text-cafe font-bold">Edad</span>
                            <span className="font-semibold">{formatearEdad(edadMeses)}</span>
                        </div>
                        <div className="rounded-lg bg-crema p-2">
                            <span className="block text-[10px] uppercase tracking-wider text-cafe font-bold">Peso / Talla</span>
                            <span className="font-semibold">{peso} kg {talla ? `· ${talla}` : ''}</span>
                        </div>
                    </div>

                    {/* Tags de Temperamento y Pelaje */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                        {temperamento && (
                            <span className="rounded-md bg-celeste/30 px-2 py-0.5 text-xs font-medium text-marino">
                                ✨ {temperamento}
                            </span>
                        )}
                        {colorPelaje && (
                            <span className="rounded-md bg-beige/30 px-2 py-0.5 text-xs font-medium text-cafe">
                                🎨 {colorPelaje}
                            </span>
                        )}
                    </div>

                    {historia && (
                        <p className="line-clamp-2 text-xs text-marino/70 italic">
                            "{historia}"
                        </p>
                    )}
                </div>

                {/* Acciones */}
                <div className="mt-4 pt-3 border-t border-beige/40">
                    {modoPublico ? (
                        <button
                            type="button"
                            disabled={estado !== 'DISPONIBLE' && estado !== 'ADOPCION'}
                            onClick={() => onAdoptar?.(codigoFelino)}
                            className="w-full rounded-xl bg-marino py-2.5 text-sm font-semibold text-crema transition hover:bg-marino/90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {estado === 'ADOPTADO' ? '¡Ya fue adoptado!' : 'Quiero Adoptar'}
                        </button>
                    ) : (
                        accionesAdmin || null
                    )}
                </div>
            </div>
        </article>
    )
}