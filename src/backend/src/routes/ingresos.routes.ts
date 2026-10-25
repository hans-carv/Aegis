// src/routes/ingresos.routes.ts
import { Router } from 'express';
import { crearIngresoController, listarIngresosController } from '../controllers/ingresos.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();

// Endpoint protegido para registro de felinos
router.post('/', authenticateJWT, authorizeRole('ADMIN'), crearIngresoController);
router.get('/', authenticateJWT, listarIngresosController);

export default router;