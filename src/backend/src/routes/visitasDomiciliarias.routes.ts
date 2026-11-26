import { Router } from 'express';
import {
  agendarVisitaDomiciliariaController,
  listarAgendaVisitasController,
} from '../controllers/visitasDomiciliarias.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

router.post(
  '/admin/visitas-domiciliarias',
  authenticateJWT,
  authorizeRole('ADMIN'),
  agendarVisitaDomiciliariaController
);

router.get(
  '/admin/visitas-domiciliarias',
  authenticateJWT,
  authorizeRole('ADMIN'),
  listarAgendaVisitasController
);

export default router;