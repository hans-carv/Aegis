export interface Usuario {
    id: string
    nombre: string
    email: string
    rol: 'ADMIN' | 'USUARIO'
    token?: string
}

export interface AuthContextType {
    usuario: Usuario | null
    estaAutenticado: boolean
    cargando: boolean
    login: (email: string, pass: string) => Promise<void>
    logout: () => void
}
