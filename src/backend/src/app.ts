// src/app.ts
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Montar las rutas de autenticación
app.use('/api/auth', authRoutes);

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