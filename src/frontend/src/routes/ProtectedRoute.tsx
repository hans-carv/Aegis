import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../hooks/useAuth'

export default function ProtectedRoute() {
    const { estaAutenticado, cargando } = useAuth()

    if (cargando) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-crema">
                <div className="flex flex-col items-center gap-3">
                    <svg className="h-8 w-8 animate-spin text-marino" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                    </svg>
                    <p className="text-sm font-semibold text-marino">Cargando sesión...</p>
                </div>
            </div>
        )
    }

    if (!estaAutenticado) {
        return <Navigate to="/login" replace />
    }

    return <Outlet />
}