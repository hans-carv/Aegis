import type { Usuario } from '../types/auth'

export async function loginSimulado(email: string, contrasena: string): Promise<Usuario> {
    // Simulacion de retraso de red
    await new Promise((resolve) => setTimeout(resolve, 800))

    // Credenciales simuladas para pruebas
    if (email === 'admin@teocatcafe.bo' && contrasena === 'admin123') {
        const usuarioSimulado: Usuario = {
            id: 'usr-admin-01',
            nombre: 'Administrador Teo',
            email: email,
            rol: 'ADMIN',
        }
        return usuarioSimulado
    }

    // Para que acepte cualquier correo y comtraseña
    if (email.includes('@') && contrasena.length >= 4) {
        return {
            id: 'usr-demo',
            nombre: 'Usuario Demo',
            email: email,
            rol: 'ADMIN',
        }
    }

    throw new Error('Credenciales inválidas. Verifica tu correo y contraseña.')
}