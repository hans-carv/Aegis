// src/routes/auth.routes.ts
import { Router, Request, Response } from 'express';
import { loginController } from '../controllers/auth.controller';
import { authenticateJWT, authorizeRole } from '../middlewares/auth.middleware';

const router = Router();


router.post('/login', loginController);

router.get('/perfil', authenticateJWT, (req: Request, res: Response) => {
  res.status(200).json({ ok: true, usuario: req.user });
});

router.get('/admin-only', authenticateJWT, authorizeRole('ADMIN'), (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, message: 'Bienvenido al área administrativa.' });
});

export default router;