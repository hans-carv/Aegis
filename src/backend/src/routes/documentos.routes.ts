import { Router } from 'express';
import {
  subirDocumentosController,
  verDocumentoAdminController,
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

export default router;