// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserSessionPayload } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      user?: UserSessionPayload;
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Acceso no autorizado: Token no proporcionado.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';

  try {
    const decoded = jwt.verify(token, secret) as UserSessionPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Acceso no autorizado: Token inválido o expirado.' });
  }
};

export const authorizeRole = (...allowedRoles: Array<'ADMIN' | 'USUARIO'>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado.' });
      return;
    }

    if (!allowedRoles.includes(req.user.rol)) {
      res.status(403).json({
        message: 'Acceso prohibido: Tu rol actual no tiene privilegios para acceder a este recurso.',
      });
      return;
    }

    next();
  };
};