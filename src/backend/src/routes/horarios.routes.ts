// src/routes/horarios.routes.ts
import { Router } from 'express';
import {
  crearHorarioController,
  actualizarHorarioController,
  listarHorariosController,
} from '../controllers/horarios.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Rutas protegidas solo para ADMIN (Criterio 3: rol USUARIO recibe 403)
router.post('/', authenticateJWT, authorizeRole('ADMIN'), crearHorarioController);
router.put('/:id', authenticateJWT, authorizeRole('ADMIN'), actualizarHorarioController);

// Listar las franjas horarias
router.get('/', authenticateJWT, listarHorariosController);

export default router;