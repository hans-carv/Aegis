import { Router } from 'express';
import {
  vincularAdopcionController,
  obtenerFichaAdminGatoController,
} from '../controllers/adopcionesFormales.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/admin/adopciones/vincular',
  authenticateJWT,
  authorizeRole('ADMIN'),
  vincularAdopcionController
);


router.get(
  '/admin/cats/:id/ficha',
  authenticateJWT,
  authorizeRole('ADMIN'),
  obtenerFichaAdminGatoController
);

export default router;