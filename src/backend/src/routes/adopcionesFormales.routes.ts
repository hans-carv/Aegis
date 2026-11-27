import { Router } from 'express';
import multer from 'multer';
import {
  vincularAdopcionController,
  obtenerFichaAdminGatoController,
  listarAdopcionesController,
} from '../controllers/adopcionesFormales.controller';
import {
  descargarContratoPdfController,
  subirContratoFirmadoController,
} from '../controllers/contratoAdopcion.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();
const uploadContrato = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get(
  '/admin/adopciones',
  authenticateJWT,
  authorizeRole('ADMIN'),
  listarAdopcionesController
);

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

router.get(
  ['/admin/adopciones/:id/contrato-pdf', '/admin/adopciones/:id/contrado-pdf'],
  authenticateJWT,
  authorizeRole('ADMIN'),
  descargarContratoPdfController
);

router.post(
  '/admin/adopciones/:id/contrato-firmado',
  authenticateJWT,
  authorizeRole('ADMIN'),
  uploadContrato.single('contrato'),
  subirContratoFirmadoController
);

export default router;