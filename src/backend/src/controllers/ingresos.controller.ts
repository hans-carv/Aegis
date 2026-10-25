// src/controllers/ingresos.controller.ts
import { Request, Response } from 'express';
import { IngresosService } from '../services/ingresos.service';

export const crearIngresoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const nuevoIngreso = await IngresosService.registrarIngreso(req.body, userId);
    res.status(201).json({
      ok: true,
      mensaje: 'Ingreso registrado exitosamente.',
      data: nuevoIngreso,
    });
  } catch (error: any) {
    console.error('ERROR EN CREAR INGRESO:', error);

    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Error interno al registrar el ingreso.' });
  }
};

export const listarIngresosController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const lista = await IngresosService.listarIngresos();
    res.status(200).json({ ok: true, data: lista });
  } catch (error: any) {
    console.error('ERROR LISTAR INGRESOS:', error);
    res.status(500).json({ message: 'Error interno al listar los ingresos.' });
  }
};