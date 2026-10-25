// src/routes/public.routes.ts
import { Router } from 'express';
import { catalogoPublicoController } from '../controllers/cats.controller';

const router = Router();

router.get('/cats', (req, res) => catalogoPublicoController(req, res));

export { router as publicRoutes };
export default router;