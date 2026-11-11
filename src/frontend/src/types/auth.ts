// src/types/auth.ts
export type RolUsuario = 'ADMIN' | 'CLIENTE' | 'USUARIO'

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: RolUsuario
  token?: string
}

export interface AuthContextType {
  usuario: Usuario | null
  estaAutenticado: boolean
  cargando: boolean
  token: string | null
  login: (email: string, pass: string) => Promise<Usuario | void>
  register: (nombre: string, email: string, pass: string) => Promise<Usuario>
  logout: () => void
}
