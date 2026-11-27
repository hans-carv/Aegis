import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import Home from './pages/public/Home'

// Lazy loading por rutas para reducir el bundle inicial
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const PublicCatalog = lazy(() => import('./pages/public/PublicCatalog'))
const ReservarVisita = lazy(() => import('./pages/public/ReservarVisita'))
const PortularAdopcion = lazy(() => import('./pages/public/PostularAdopcion'))
const MiPerfil = lazy(() => import('./pages/public/MiPerfil'))

const AdminHome = lazy(() => import('./pages/admin/AdminHome'))
const RegistrarIngreso = lazy(() => import('./pages/admin/RegistrarIngreso'))
const RegistrarGato = lazy(() => import('./pages/admin/RegistrarGato'))
const HorariosAforo = lazy(() => import('./pages/admin/HorariosAforo'))
const GestionPostulaciones = lazy(() => import('./pages/admin/GestionPostulaciones'))
const GestionClinica = lazy(() => import('./pages/admin/GestionClinica'))
const DirectorioAdoptantes = lazy(() => import('./pages/admin/DirectorioAdoptantes'))

function CargandoRuta() {
    return (
        <div className="flex min-h-[45vh] flex-col items-center justify-center gap-3 p-8">
            <div className="h-8 w-8 animate-spin rounded-full border-3 border-celeste border-t-marino" />
            <p className="font-sans text-xs font-semibold text-marino/70">Cargando módulo...</p>
        </div>
    )
}

export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <BrowserRouter>
                    <Suspense fallback={<CargandoRuta />}>
                        <Routes>
                            {/* Rutas Públicas */}
                            <Route element={<PublicLayout />}>
                                <Route path="/" element={<Home />} />
                                <Route path="/catalogo" element={<PublicCatalog />} />
                                <Route path="/cats" element={<Navigate to="/catalogo" replace />} />
                                <Route path="/gatos" element={<Navigate to="/catalogo" replace />} />
                                <Route path="/visita" element={<ReservarVisita />} />
                                <Route path="/reservas" element={<Navigate to="/visita" replace />} />
                                <Route path="/reserva" element={<Navigate to="/visita" replace />} />
                                <Route element={<ProtectedRoute />}>
                                    <Route path="/perfil" element={<MiPerfil />} />
                                    <Route path="/adoptar/:gatoId" element={<PortularAdopcion />} />
                                    <Route path="/postular/:gatoId" element={<Navigate to="/adoptar/:gatoId" replace />} />
                                </Route>
                            </Route>

                            {/* Autenticación */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/register" element={<Register />} />

                            {/* Rutas de Administración */}
                            <Route element={<ProtectedRoute rolRequerido="ADMIN" />}>
                                <Route path="/admin" element={<AdminLayout />}>
                                    <Route index element={<AdminHome />} />
                                    <Route path="ingresos" element={<RegistrarIngreso />} />
                                    <Route path="felinos" element={<RegistrarGato />} />
                                    <Route path="horarios" element={<HorariosAforo />} />
                                    <Route path="postulaciones" element={<GestionPostulaciones />} />
                                    <Route path="adopciones" element={<DirectorioAdoptantes />} />
                                    <Route path="clinica" element={<GestionClinica />} />
                                </Route>
                            </Route>

                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </BrowserRouter>
            </ToastProvider>
        </AuthProvider>
    )
}
