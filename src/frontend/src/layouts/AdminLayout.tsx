import { NavLink, Outlet, useNavigate } from 'react-router'
import { useAuth } from '../hooks/useAuth'
import teoLogo from '../assets/teo.jfif'

const navItems = [
    { to: '/admin', label: 'Inicio', shortLabel: 'Inicio', end: true },
    { to: '/admin/ingresos', label: 'Ingresos de gatos', shortLabel: 'Ingresos', end: false },
    { to: '/admin/felinos', label: 'Felinos', shortLabel: 'Felinos', end: false },
] as const

function HomeIcon() {
    return (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
    )
}

function IngresosIcon() {
    return (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
            <rect x="3" y="3" width="18" height="18" rx="4" />
        </svg>
    )
}

function FelinosIcon() {
    return (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M5 11c0 4 3 8 7 8s7-4 7-8c0-2-1-5-3-6l-1.5 3L12 6l-2.5 2L8 5c-2 1-3 4-3 6Z" />
            <circle cx="10" cy="11" r="0.8" fill="currentColor" />
            <circle cx="14" cy="11" r="0.8" fill="currentColor" />
        </svg>
    )
}


function LogoutIcon() {
    return (
        <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M10 17l5-5-5-5M15 12H3M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" />
        </svg>
    )
}

const icons = [HomeIcon, IngresosIcon, FelinosIcon]

function linkClass(isActive: boolean, compact: boolean) {
    const base = compact
        ? 'flex flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-semibold transition'
        : 'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition'

    if (isActive) {
        return `${base} bg-celeste/40 text-marino`
    }

    return `${base} text-crema/80 hover:bg-white/10 hover:text-crema`
}

export default function AdminLayout() {
    const { logout } = useAuth()
    const navigate = useNavigate()
    
    function handleLogout() {
        // Simulación de cierre de sesión
        logout()
        navigate('/login')
    }

    return (
        <div className="flex min-h-svh bg-crema font-sans text-marino">
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col justify-between bg-marino text-crema md:flex">
                <div className="flex items-center gap-3 px-5 py-6">
                    <img
                        src={teoLogo}
                        alt=""
                        className="h-12 w-12 rounded-2xl object-cover ring-2 ring-celeste/70"
                    />
                    <div>
                        <p className="font-heading text-lg font-semibold tracking-tight">Proyecto Teo</p>
                        <p className="text-xs text-beige">Panel administrativo</p>
                    </div>
                </div>

                <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Administración">
                    {navItems.map((item, index) => {
                        const Icon = icons[index]
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => linkClass(isActive, false)}
                            >
                                <Icon />
                                {item.label}
                            </NavLink>
                        )
                    })}
                </nav>

                {/* Botón de Cerrar Sesión en el Sidebar */}
                <div className="p-3 border-t border-white/10">
                <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-beige transition hover:bg-red-500/20 hover:text-red-200"
                >
                    <LogoutIcon />
                    Cerrar sesión
                </button>
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center gap-3 bg-marino px-4 py-3 text-crema md:hidden">
                    <div className="flex items-center gap-3">
                        <img src={teoLogo} alt="" className="h-10 w-10 rounded-xl object-cover ring-2 ring-celeste/70" />
                        <div>
                            <p className="font-heading text-base font-semibold">Proyecto Teo</p>
                            <p className="text-[11px] text-beige">Panel administrativo</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleLogout}
                        title="Cerrar sesión"
                        className="rounded-lg p-2 text-beige hover:bg-white/10"
                    >
                        <LogoutIcon />
                    </button>                    
                </header>

                <main className="flex-1 px-4 py-6 pb-24 sm:px-6 md:px-8 md:pb-8">
                    <Outlet />
                </main>

                <nav
                    className="fixed right-0 bottom-0 left-0 z-10 flex border-t border-beige/60 bg-marino px-2 py-1.5 text-crema md:hidden"
                    aria-label="Administración"
                >
                    {navItems.map((item, index) => {
                        const Icon = icons[index]
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                end={item.end}
                                className={({ isActive }) => linkClass(isActive, true)}
                            >
                                <Icon />
                                {item.shortLabel}
                            </NavLink>
                        )
                    })}
                </nav>
            </div>
        </div>
    )
}
