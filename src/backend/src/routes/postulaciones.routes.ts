import { Router } from 'express';
import {
  crearPostulacionController,
  bloquearModificacionController,
  listarPostulacionesAdminController,
  listarMisPostulacionesController,
  cancelarPostulacionController,
} from '../controllers/postulaciones.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticateJWT, crearPostulacionController);
router.get('/mis-postulaciones', authenticateJWT, listarMisPostulacionesController);
router.put('/:id', authenticateJWT, bloquearModificacionController);
router.get('/admin', authenticateJWT, authorizeRole('ADMIN'), listarPostulacionesAdminController);

router.patch('/:id/cancelar', authenticateJWT, cancelarPostulacionController);

export default router;