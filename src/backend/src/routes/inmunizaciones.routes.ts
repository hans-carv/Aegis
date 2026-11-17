import { Router } from 'express';
import {
  registrarInmunizacionController,
  listarInmunizacionesController,
} from '../controllers/inmunizaciones.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/admin/cats/:id/inmunizaciones',
  authenticateJWT,
  authorizeRole('ADMIN'),
  registrarInmunizacionController
);

router.get(
  '/admin/cats/:id/inmunizaciones',
  authenticateJWT,
  authorizeRole('ADMIN'),
  listarInmunizacionesController
);

router.get(
  '/cats/:id/vacunas',
  authenticateJWT,
  authorizeRole('ADMIN'),
  listarInmunizacionesController
);

export default router;