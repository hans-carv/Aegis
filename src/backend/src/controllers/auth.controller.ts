// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

export const registerController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { nombre, email, password } = req.body;

    if (!nombre || typeof nombre !== 'string' || !nombre.trim()) {
      res.status(400).json({ message: 'El nombre completo es obligatorio.' });
      return;
    }

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      res.status(400).json({ message: 'Introduce un correo electrónico válido.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres.' });
      return;
    }

    const data = await AuthService.register(nombre, email, password);
    res.status(201).json({
      ok: true,
      message: 'Usuario registrado exitosamente.',
      ...data,
    });
  } catch (error: any) {
    if (error.status === 409) {
      res.status(409).json({ message: error.message });
      return;
    }
    res.status(error.status || 500).json({
      message: error.message || 'Error interno al registrar usuario.',
    });
  }
};