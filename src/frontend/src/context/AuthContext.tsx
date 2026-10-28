import { createContext, useState, useEffect, type ReactNode } from 'react'
import type { Usuario, AuthContextType } from '../types/auth'
import { loginReal, logoutUsuario } from '../services/authService'
import { setAuthToken, removeAuthToken } from '../services/api'

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        // Restaurar sesion persistente si existe en localStorage
        const sesionGuardada = localStorage.getItem('teo_user_session')
        const tokenGuardado = localStorage.getItem('teo_auth_token')
        if (sesionGuardada && tokenGuardado) {
            try {
                const userParsed = JSON.parse(sesionGuardada)
                userParsed.token = tokenGuardado
                setUsuario(userParsed)
                setAuthToken(tokenGuardado)
            } catch {
                localStorage.removeItem('teo_user_session')
                removeAuthToken()
            }
        }
        setCargando(false)
    }, [])

    async function login(email: string, pass: string) {
        const datosUsuario = await loginReal(email, pass)
        setUsuario(datosUsuario)
        localStorage.setItem('teo_user_session', JSON.stringify(datosUsuario))
    }

    function logout() {
        setUsuario(null)
        localStorage.removeItem('teo_user_session')
        logoutUsuario()
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
