import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import AdminHome from './pages/admin/AdminHome'
import RegistrarIngreso from './pages/admin/RegistrarIngreso'
import RegistrarGato from './pages/admin/RegistrarGato'
import HorariosAforo from './pages/admin/HorariosAforo'
import GestionPostulaciones from './pages/admin/GestionPostulaciones'
import PublicCatalog from './pages/public/PublicCatalog'
import ReservarVisita from './pages/public/ReservarVisita'
import PortularAdopcion from './pages/public/PostularAdopcion'
import MiPerfil from './pages/public/MiPerfil'
import Home from './pages/public/Home'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
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
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}
