// src/services/authService.ts
import type { Usuario } from '../types/auth'
import { apiRequest, setAuthToken, removeAuthToken } from './api'

interface AuthBackendResponse {
  token: string
  user: {
    id: string
    nombre: string
    email?: string
    rol: 'ADMIN' | 'CLIENTE' | 'USUARIO'
  }
  message?: string
}

export async function login(email: string, contrasena: string): Promise<Usuario> {
  const data = await apiRequest<AuthBackendResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim(),
      password: contrasena,
    }),
  })

  setAuthToken(data.token)

  return {
    id: data.user.id,
    nombre: data.user.nombre,
    email: data.user.email || email.trim(),
    rol: data.user.rol,
    token: data.token,
  }
}

export const loginReal = login

export async function register(nombre: string, email: string, contrasena: string): Promise<Usuario> {
  const data = await apiRequest<AuthBackendResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      nombre: nombre.trim(),
      email: email.trim(),
      password: contrasena,
    }),
  })

  setAuthToken(data.token)

  return {
    id: data.user.id,
    nombre: data.user.nombre,
    email: data.user.email || email.trim(),
    rol: data.user.rol,
    token: data.token,
  }
}

export function logoutUsuario(): void {
  removeAuthToken()
}

export async function loginSimulado(email: string, contrasena: string): Promise<Usuario> {
  return login(email, contrasena)
}
