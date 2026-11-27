import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router'
import {
    Award,
    CalendarClock,
    Cat,
    ClipboardList,
    Home,
    LogOut,
    Menu,
    PanelLeftClose,
    PanelLeftOpen,
    PlusSquare,
    Stethoscope,
    X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import teoLogo from '../assets/teo.jfif'

const navItems = [
    { to: '/admin', label: 'Inicio', shortLabel: 'Inicio', end: true, icon: Home },
    { to: '/admin/ingresos', label: 'Ingresos de gatos', shortLabel: 'Ingresos', end: false, icon: PlusSquare },
    { to: '/admin/felinos', label: 'Felinos', shortLabel: 'Felinos', end: false, icon: Cat },
    { to: '/admin/clinica', label: 'Historial clínico', shortLabel: 'Clínica', end: false, icon: Stethoscope },
    { to: '/admin/horarios', label: 'Horarios de visita y aforo', shortLabel: 'Horarios', end: false, icon: CalendarClock },
    { to: '/admin/postulaciones', label: 'Postulaciones de adopción', shortLabel: 'Postulaciones', end: false, icon: ClipboardList },
    { to: '/admin/adopciones', label: 'Adopciones y contratos', shortLabel: 'Adopciones', end: false, icon: Award },
] as const

function linkClass(isActive: boolean, collapsed: boolean) {
    const base = collapsed
        ? 'flex items-center justify-center rounded-xl p-2.5 text-sm font-semibold transition'
        : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition'

    if (isActive) {
        return `${base} bg-celeste/40 text-marino`
    }

    return `${base} text-crema/80 hover:bg-white/10 hover:text-crema`
}

export default function AdminLayout() {
    const { logout } = useAuth()
    const navigate = useNavigate()
    const [colapsadoDesktop, setColapsadoDesktop] = useState(false)
    const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)

    function handleLogout() {
        logout()
        navigate('/login')
    }

    return (
        <div className="flex min-h-svh flex-col bg-crema font-sans text-marino md:flex-row">
            {/* Barra Superior Móvil */}
            <header className="sticky top-0 z-30 flex items-center justify-between bg-marino px-4 py-3 text-crema shadow-md md:hidden">
                <div className="flex items-center gap-2.5">
                    <img
                        src={teoLogo}
                        alt="Logo Proyecto Teo"
                        className="h-9 w-9 rounded-xl object-cover ring-2 ring-celeste/70"
                    />
                    <div>
                        <p className="font-heading text-base font-semibold leading-tight text-crema">
                            Proyecto Teo
                        </p>
                        <p className="text-[11px] text-beige">Panel administrativo</p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setMenuMovilAbierto((prev) => !prev)}
                    aria-label={menuMovilAbierto ? 'Cerrar menú' : 'Abrir menú'}
                    aria-expanded={menuMovilAbierto}
                    className="rounded-xl p-2 text-crema hover:bg-white/10 cursor-pointer"
                >
                    {menuMovilAbierto ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </header>

            {/* Backdrop Móvil */}
            {menuMovilAbierto && (
                <div
                    className="fixed inset-0 z-30 bg-marino/55 backdrop-blur-xs md:hidden"
                    onClick={() => setMenuMovilAbierto(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Lateral (Retráctil en Desktop + Drawer en Móvil) */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex h-screen shrink-0 flex-col justify-between bg-marino text-crema shadow-lg transition-all duration-200 md:sticky md:top-0 ${
                    menuMovilAbierto ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
                } ${colapsadoDesktop ? 'w-64 md:w-20' : 'w-64'}`}
            >
                <div>
                    <div
                        className={`flex items-center border-b border-white/10 py-5 ${
                            colapsadoDesktop ? 'justify-between px-4 md:justify-center md:px-2' : 'justify-between px-4'
                        }`}
                    >
                        <div className={`flex items-center gap-3 ${colapsadoDesktop ? 'md:hidden' : ''}`}>
                            <img
                                src={teoLogo}
                                alt="Logo Proyecto Teo"
                                className="h-11 w-11 shrink-0 rounded-2xl object-cover ring-2 ring-celeste/70 shadow-sm"
                            />
                            <div className="min-w-0">
                                <p className="truncate font-heading text-lg font-semibold tracking-tight text-crema">
                                    Proyecto Teo
                                </p>
                                <p className="truncate text-xs text-beige">Panel administrativo</p>
                            </div>
                        </div>

                        {/* Botón para retraer / expandir en Desktop */}
                        <button
                            type="button"
                            onClick={() => setColapsadoDesktop((prev) => !prev)}
                            aria-label={colapsadoDesktop ? 'Expandir menú lateral' : 'Retraer menú lateral'}
                            title={colapsadoDesktop ? 'Expandir menú' : 'Retraer menú'}
                            className="hidden rounded-xl p-2 text-beige transition hover:bg-white/10 hover:text-crema md:inline-flex cursor-pointer"
                        >
                            {colapsadoDesktop ? (
                                <PanelLeftOpen className="h-5 w-5" />
                            ) : (
                                <PanelLeftClose className="h-5 w-5" />
                            )}
                        </button>

                        {/* Botón cerrar en Móvil */}
                        <button
                            type="button"
                            onClick={() => setMenuMovilAbierto(false)}
                            aria-label="Cerrar menú lateral"
                            className="rounded-xl p-2 text-beige hover:bg-white/10 hover:text-crema md:hidden cursor-pointer"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <nav className="flex flex-col gap-1.5 px-3 py-4" aria-label="Administración">
                        {navItems.map((item) => {
                            const Icon = item.icon
                            return (
                                <NavLink
                                    key={item.to}
                                    to={item.to}
                                    end={item.end}
                                    title={colapsadoDesktop ? item.label : undefined}
                                    onClick={() => setMenuMovilAbierto(false)}
                                    className={({ isActive }) => linkClass(isActive, colapsadoDesktop)}
                                >
                                    <Icon className="h-5 w-5 shrink-0" />
                                    <span className={colapsadoDesktop ? 'md:hidden' : ''}>{item.label}</span>
                                </NavLink>
                            )
                        })}
                    </nav>
                </div>

                {/* Botón de Cerrar Sesión en el Sidebar */}
                <div className="border-t border-white/10 p-3">
                    <button
                        type="button"
                        onClick={handleLogout}
                        title={colapsadoDesktop ? 'Cerrar sesión' : undefined}
                        className={`flex w-full items-center rounded-xl py-2.5 text-sm font-semibold text-beige transition hover:bg-red-500/20 hover:text-red-200 cursor-pointer ${
                            colapsadoDesktop ? 'justify-center px-2' : 'gap-3 px-3'
                        }`}
                    >
                        <LogOut className="h-5 w-5 shrink-0" />
                        <span className={colapsadoDesktop ? 'md:hidden' : ''}>Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            {/* Contenedor Principal */}
            <div className="flex min-w-0 flex-1 flex-col">
                <main className="flex-1 px-4 py-6 sm:px-6 md:px-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
