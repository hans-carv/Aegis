// src/routes/reservas.routes.ts
import { Router } from 'express';
import {
  consultarDisponibilidadController,
  crearReservaController,
  listarMisReservasController,
} from '../controllers/reservas.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.get('/disponibilidad', consultarDisponibilidadController);
router.post('/', authenticateJWT, crearReservaController);
router.get('/mis-reservas', authenticateJWT, listarMisReservasController);

export default router;