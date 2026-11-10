// src/context/AuthContext.tsx
import { createContext, useState, useEffect, type ReactNode } from 'react'
import type { Usuario, AuthContextType } from '../types/auth'
import { login as loginService, register as registerService } from '../services/authService' // 👈 import actualizado

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const sesionGuardada = localStorage.getItem('teo_user_session')
    const tokenGuardado = localStorage.getItem('teo_auth_token')

    if (sesionGuardada && tokenGuardado) {
      try {
        setUsuario(JSON.parse(sesionGuardada))
        setToken(tokenGuardado)
      } catch {
        localStorage.removeItem('teo_user_session')
        localStorage.removeItem('teo_auth_token')
      }
    }
    setCargando(false)
  }, [])

  async function login(email: string, pass: string): Promise<Usuario> {
    const datosUsuario = await loginService(email, pass)
    const tokenActual = localStorage.getItem('teo_auth_token')

    setUsuario(datosUsuario)
    setToken(tokenActual)

    localStorage.setItem('teo_user_session', JSON.stringify(datosUsuario))
    return datosUsuario
  }

  async function register(nombre: string, email: string, pass: string): Promise<Usuario> {
    const datosUsuario = await registerService(nombre, email, pass)
    const tokenActual = localStorage.getItem('teo_auth_token')

    setUsuario(datosUsuario)
    setToken(tokenActual)

    localStorage.setItem('teo_user_session', JSON.stringify(datosUsuario))
    return datosUsuario
  }

  function logout() {
    setUsuario(null)
    setToken(null)
    localStorage.removeItem('teo_user_session')
    localStorage.removeItem('teo_auth_token')
  }

  return (
    <AuthContext.Provider
      value={{
        usuario,
        estaAutenticado: Boolean(usuario),
        cargando,
        token,
        login,
        register, // 👈 expuesto al contexto
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}