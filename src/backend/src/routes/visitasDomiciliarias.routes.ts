import { Router } from 'express';
import {
  agendarVisitaDomiciliariaController,
  listarAgendaVisitasController,
  emitirDictamenVisitaController,
  subirEvidenciaAdecuacionController,
  verificarContratoPostulacionController,
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

router.patch(
  '/admin/visitas-domiciliarias/:id/dictamen',
  authenticateJWT,
  authorizeRole('ADMIN'),
  emitirDictamenVisitaController
);

router.post(
  '/visitas-domiciliarias/:id/evidencias',
  authenticateJWT,
  subirEvidenciaAdecuacionController
);

router.post(
  '/admin/postulaciones/:postulacionId/contrato',
  authenticateJWT,
  authorizeRole('ADMIN'),
  verificarContratoPostulacionController
);

export default router;