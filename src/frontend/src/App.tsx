import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import AdminLayout from './layouts/AdminLayout'
import AdminHome from './pages/admin/AdminHome'
import RegistrarIngreso from './pages/admin/RegistrarIngreso'
import Login from './pages/auth/Login'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} />
          <Route path="ingresos" element={<RegistrarIngreso />} />
          <Route path="felinos" element={null} />
        </Route>
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
