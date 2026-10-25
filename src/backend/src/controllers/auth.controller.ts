// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

export const loginController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'El correo y la contraseña son obligatorios.' });
      return;
    }

    const authData = await AuthService.login(String(email).trim(), String(password));

    if (!authData) {
      res.status(401).json({ message: 'Credenciales inválidas.' });
      return;
    }

    res.status(200).json(authData);
  } catch (error) {
    res.status(500).json({ message: 'Error interno en el servicio de autenticación.' });
  }
};