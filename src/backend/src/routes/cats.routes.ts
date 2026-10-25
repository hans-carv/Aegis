// src/routes/cats.routes.ts
import { Router } from 'express';
import {
  registrarFelinoController,
  listarFelinosController,
  obtenerFichaFelinoController,
  actualizarFelinoController,
} from '../controllers/cats.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

//Solo ADMIN puede crear y editar
//ADMIN y USUARIO pueden consultar
router.post('/', authenticateJWT, authorizeRole('ADMIN'), registrarFelinoController);
router.get('/', authenticateJWT, listarFelinosController);
router.get('/:id', authenticateJWT, obtenerFichaFelinoController);
router.put('/:id', authenticateJWT, authorizeRole('ADMIN'), actualizarFelinoController);

export default router;