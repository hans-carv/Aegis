import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './routes/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import PublicLayout from './layouts/PublicLayout'
import AdminHome from './pages/admin/AdminHome'
import RegistrarIngreso from './pages/admin/RegistrarIngreso'
import RegistrarGato from './pages/admin/RegistrarGato'
import PublicCatalog from './pages/public/PublicCatalog'
import Home from './pages/public/Home'
import Login from './pages/auth/Login'

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    {/* Rutas Públicas */}
                    <Route element={<PublicLayout />}>
                        <Route path="/" element={<Home />} />
                        <Route path="/catalogo" element={<PublicCatalog />} />
                    </Route>
                    {/* Autenticación */}
                    <Route path="/login" element={<Login />} />
                    {/* Rutas de Administración */}
                    <Route element={<ProtectedRoute />}>
                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<AdminHome />} />
                            <Route path="ingresos" element={<RegistrarIngreso />} />
                            <Route path="felinos" element={<RegistrarGato />} />
                        </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}