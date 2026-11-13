import { BrowserRouter, Routes, Route, Navigate } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicLayout from './layouts/PublicLayout'
import AdminLayout from './layouts/AdminLayout'
import AdminHome from './pages/admin/AdminHome'
import RegistrarIngreso from './pages/admin/RegistrarIngreso'
import RegistrarGato from './pages/admin/RegistrarGato'
import HorariosAforo from './pages/admin/HorariosAforo'
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
                        <Route path="/visita" element={<ReservarVisita />} />
                        <Route element={<ProtectedRoute />}>
                            <Route path="/perfil" element={<MiPerfil />} />
                            <Route path="/adoptar/:gatoId" element={<PortularAdopcion />} />
                        </Route>
                    </Route>

                    {/* Autenticación */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Rutas de Administración */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminHome />} />
                            <Route path="ingresos" element={<RegistrarIngreso />} />
                            <Route path="felinos" element={<RegistrarGato />} />
                            <Route path="horarios" element={<HorariosAforo />} />
                        </Route>
                    </Route>

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}
