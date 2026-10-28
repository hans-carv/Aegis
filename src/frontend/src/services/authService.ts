import type { Usuario } from '../types/auth'
import { apiRequest, setAuthToken, removeAuthToken } from './api'

interface LoginApiResponse {
    token: string
    user: {
        id: string
        nombre: string
        rol: 'ADMIN' | 'USUARIO'
    }
}

export async function loginReal(email: string, contrasena: string): Promise<Usuario> {
    const data = await apiRequest<LoginApiResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password: contrasena }),
    })

    setAuthToken(data.token)

    return {
        id: data.user.id,
        nombre: data.user.nombre,
        email: email.trim(),
        rol: data.user.rol,
        token: data.token,
    }
}

export function logoutUsuario(): void {
    removeAuthToken()
}

// Para retrocompatibilidad si fuese necesario
export async function loginSimulado(email: string, contrasena: string): Promise<Usuario> {
    await new Promise((resolve) => setTimeout(resolve, 800))
    if (email === 'admin@teocatcafe.bo' && contrasena === 'admin123') {
        return {
            id: 'usr-admin-01',
            nombre: 'Administrador Teo',
            email,
            rol: 'ADMIN',
        }
    }
    if (email.includes('@') && contrasena.length >= 4) {
        return {
            id: 'usr-demo',
            nombre: 'Usuario Demo',
            email,
            rol: 'ADMIN',
        }
    }
    throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.')
}
