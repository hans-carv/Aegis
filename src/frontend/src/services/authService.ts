// src/services/authService.ts
import type { Usuario } from '../types/auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

interface LoginBackendResponse {
  ok: boolean
  token: string
  user: {
    id: string
    nombre: string
    email: string
    rol: 'ADMIN' | 'CLIENTE' | 'USUARIO'
  }
  message?: string
}

export async function login(email: string, contrasena: string): Promise<Usuario> {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email.trim(),
      password: contrasena,
    }),
  })

  const data: LoginBackendResponse = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Credenciales inválidas. Verifica tu correo y contraseña.')
  }

  localStorage.setItem('teo_auth_token', data.token)

  return {
    id: data.user.id,
    nombre: data.user.nombre,
    email: data.user.email,
    rol: data.user.rol,
  }
}

export const loginSimulado = login

export async function register(nombre: string, email: string, contrasena: string): Promise<Usuario> {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      nombre: nombre.trim(),
      email: email.trim(),
      password: contrasena,
    }),
  })

  const data: LoginBackendResponse = await response.json()

  if (!response.ok) {
    throw new Error(data.message || 'Error al registrar la cuenta.')
  }

  localStorage.setItem('teo_auth_token', data.token)

  return {
    id: data.user.id,
    nombre: data.user.nombre,
    email: data.user.email || email.trim(),
    rol: data.user.rol,
  }
}