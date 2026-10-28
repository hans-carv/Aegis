import { createContext, useState, useEffect, type ReactNode } from 'react'
import type { Usuario, AuthContextType } from '../types/auth'
import { loginSimulado } from '../services/authService'

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        // Restaurar sesion persistente si existe en localStorage
        const sesionGuardada = localStorage.getItem('teo_user_session')
        if (sesionGuardada) {
            try {
                setUsuario(JSON.parse(sesionGuardada))
            } catch {
                localStorage.removeItem('teo_user_session')
            }
        }
        setCargando(false)
    }, [])

    async function login(email: string, pass: string) {
        const datosUsuario = await loginSimulado(email, pass)
        setUsuario(datosUsuario)
        localStorage.setItem('teo_user_session', JSON.stringify(datosUsuario))
    }

    function logout() {
        setUsuario(null)
        localStorage.removeItem('teo_user_session')
    }

    return (
        <AuthContext.Provider
            value={{
                usuario,
                estaAutenticado: !!usuario,
                cargando,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}