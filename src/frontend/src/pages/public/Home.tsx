import { Link } from 'react-router'
import teoHeroFoto from '../../assets/teo.jfif'

export default function LandingPage() {
    return (
        <div className="flex flex-col">
            {/* Hero Section */}
            <section className="relative overflow-hidden bg-marino py-16 text-crema sm:py-24">
                <div className="mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6 md:px-8">
                    <span className="inline-flex items-center gap-2 rounded-full bg-celeste/20 px-4 py-1.5 text-xs font-semibold text-celeste ring-1 ring-[#A9D6E8]/40 mb-6">
                        ✨ Iniciativa de adopción responsable
                    </span>

                    <h1 className="font-heading text-3xl font-extrabold tracking-tight sm:text-5xl md:text-6xl max-w-3xl leading-tight">
                        Conoce a nuestros gatitos
                    </h1>

                    <p className="mt-4 max-w-2xl text-base text-beige sm:text-lg">
                        Cada uno de ellos fue rescatado y cuidado en Teo Cat Café. Esperan encontrar una familia amorosa que los acoja. ¿Serás tú su nuevo hogar?
                    </p>

                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Link
                            to="/catalogo"
                            className="inline-flex items-center gap-2.5 rounded-2xl bg-celeste px-7 py-3.5 text-base font-bold text-marino shadow-lg transition hover:bg-celeste/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                            </svg>
                            Ver gatitos disponibles
                        </Link>
                    </div>
                </div>
            </section>

            {/* Sección Informativa Teo Cat Café */}
            <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:px-8">
                <div className="grid gap-8 items-center md:grid-cols-2">
                    <div className="space-y-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-cafe">¿Cómo funcionamos?</span>
                        <h2 className="font-heading text-2xl font-bold text-marino sm:text-3xl">
                            Visítanos en la cafetería y enamórate
                        </h2>
                        <p className="text-sm text-marino/80 leading-relaxed sm:text-base">
                            Teo Cat Café es un espacio único donde puedes tomar un café mientras interactúas con felinos rescatados. El proceso de adopción formal lo coordinamos con absoluta responsabilidad para garantizar el bienestar de cada gatito.
                        </p>
                        <div className="pt-2">
                            <Link
                                to="/catalogo"
                                className="inline-flex items-center gap-2 text-sm font-bold text-marino underline underline-offset-4 hover:text-cafe"
                            >
                                Explorar catálogo de felinos →
                            </Link>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-3xl bg-white p-3 shadow-xl ring-1 ring-[#D9C3A5]">
                        <img
                            src={teoHeroFoto}
                            alt="Instalaciones Teo Cat Café"
                            className="h-72 w-full rounded-2xl object-cover sm:h-80"
                        />
                    </div>
                </div>
            </section>
        </div>
    )
}