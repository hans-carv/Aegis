import { Router } from 'express';
import {
  registrarTratamientoClinicoController,
  consultarExpedienteClinicoController,
} from '../controllers/historialClinico.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/admin/cats/:id/historial-clinico',
  authenticateJWT,
  authorizeRole('ADMIN'),
  registrarTratamientoClinicoController
);

router.get(
  '/admin/cats/:id/historial-clinico',
  authenticateJWT,
  authorizeRole('ADMIN'),
  consultarExpedienteClinicoController
);

export default router;