import { Router } from 'express';
import {
  subirDocumentosController,
  verDocumentoAdminController,
  verDocumentoPorPostulacionYCampoController,
} from '../controllers/documentos.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';
import { uploadDocumentosPostulacion } from '../middlewares/upload.middleware';

const router = Router();

router.post(
  '/:id/documentos',
  authenticateJWT,
  uploadDocumentosPostulacion,
  subirDocumentosController
);

router.get(
  '/admin/visor/:docId',
  authenticateJWT,
  authorizeRole('ADMIN'),
  verDocumentoAdminController
);

router.get(
  '/admin/visor-postulacion/:postulacionId/:campo',
  authenticateJWT,
  authorizeRole('ADMIN'),
  verDocumentoPorPostulacionYCampoController
);

export default router;