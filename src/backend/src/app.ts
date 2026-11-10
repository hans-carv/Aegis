// src/app.ts
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import ingresosRoutes from './routes/ingresos.routes';
import catsRoutes from './routes/cats.routes';
import horariosRoutes from './routes/horarios.routes';
import reservasRoutes from './routes/reservas.routes';
import postulacionesRoutes from './routes/postulaciones.routes';
import { publicRoutes } from './routes/public.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Endpoints protegidos
app.use('/api/auth', authRoutes);
app.use('/api/ingresos', ingresosRoutes);
app.use('/api/gatos', catsRoutes);
app.use('/api/admin/horarios', horariosRoutes);
app.use('/api/reservas', reservasRoutes);
app.use('/api/postulaciones', postulacionesRoutes);

// Endpoint publico
app.use('/api/public', publicRoutes);

// Endpoint de verificación
app.get('/health', (_req, res) => {
  res.json({ ok: true, mensaje: 'Servidor levantado con exito' });
});

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

export default app;