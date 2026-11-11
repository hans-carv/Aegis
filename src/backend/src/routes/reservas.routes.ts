import { Router } from 'express';
import {
  consultarDisponibilidadController,
  crearReservaController,
  listarMisReservasController,
} from '../controllers/reservas.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

// Consulta pública o autenticada de turnos
router.get('/disponibilidad', consultarDisponibilidadController);

// Rutas protegidas para usuarios registrados
router.post('/', authenticateJWT, crearReservaController);
router.get('/mis-reservas', authenticateJWT, listarMisReservasController);

export default router;
