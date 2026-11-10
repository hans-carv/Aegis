import { Router } from 'express';
import {
  crearPostulacionController,
  bloquearModificacionController,
  listarPostulacionesAdminController,
} from '../controllers/postulaciones.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticateJWT, crearPostulacionController);
router.put('/:id', authenticateJWT, bloquearModificacionController);
router.get('/admin', authenticateJWT, authorizeRole('ADMIN'), listarPostulacionesAdminController);

export default router;