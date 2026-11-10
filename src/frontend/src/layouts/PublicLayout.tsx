import { Link, NavLink, Outlet } from 'react-router'
import teoLogo from '../assets/teo.jfif'

export default function PublicLayout() {
    return (
        <div className="flex min-h-svh flex-col bg-crema font-sans text-marino">
            {/* Navbar Superior */}
            <header className="sticky top-0 z-50 border-b border-beige/50 bg-white/90 backdrop-blur-md">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 md:px-8">
                    {/* Brand Logo */}
                    <Link to="/" className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D6E8] rounded-xl p-1">
                        <img
                            src={teoLogo}
                            alt=""
                            className="h-10 w-10 rounded-xl object-cover ring-2 ring-[#A9D6E8]"
                        />
                        <div>
                            <p className="font-heading text-lg font-bold text-marino">Proyecto Teo</p>
                            <p className="text-[11px] font-medium text-cafe">Adopciones Proyecto Teo</p>
                        </div>
                    </Link>

                    {/* Navegación Pública */}
                    <nav aria-label="Navegación principal" className="flex items-center gap-2 sm:gap-6">
                        <NavLink
                            to="/"
                            end
                            className={({ isActive }) =>
                                `text-sm font-semibold transition px-3 py-2 rounded-xl ${isActive
                                    ? 'text-marino bg-celeste/30'
                                    : 'text-marino/70 hover:text-marino hover:bg-crema'
                                }`
                            }
                        >
                            Inicio
                        </NavLink>

                        <NavLink
                            to="/catalogo"
                            className={({ isActive }) =>
                                `text-sm font-semibold transition px-3 py-2 rounded-xl ${isActive
                                    ? 'text-marino bg-celeste/30'
                                    : 'text-marino/70 hover:text-marino hover:bg-crema'
                                }`
                            }
                        >
                            Adopta
                        </NavLink>

                        <Link
                            to="/login"
                            className="inline-flex items-center gap-2 rounded-xl bg-marino px-4 py-2 text-xs sm:text-sm font-semibold text-crema transition hover:bg-marino/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A9D6E8]"
                        >
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
                            </svg>
                            <span>Iniciar sesión</span>
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Contenido dinámico */}
            <main className="flex-1">
                <Outlet />
            </main>

            {/* Footer */}
            <footer className="border-t border-beige/60 bg-marino py-8 text-crema">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:flex-row sm:text-left sm:px-6 md:px-8">
                    <div>
                        <p className="font-heading text-lg font-bold">Proyecto Teo & Teo Cat Café</p>
                        <p className="text-xs text-beige">Rescate, acogida y adopción responsable de gatos.</p>
                    </div>
                    <p className="text-xs text-crema/60">
                        © {new Date().getFullYear()} Proyecto Teo · Aegis. Todos los derechos reservados.
                    </p>
                </div>
            </footer>
        </div>
    )
}