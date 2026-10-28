// src/controllers/cats.controller.ts
import { Request, Response } from 'express';
import { CatsService } from '../services/cats.service';

export const registrarFelinoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const nuevoFelino = await CatsService.registrarFelino(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Felino registrado exitosamente en el sistema.',
      data: nuevoFelino,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: error.message || 'Error interno al registrar el felino.' });
  }
};

export const listarFelinosController = async (req: Request, res: Response): Promise<void> => {
  try {
    const rol = req.user?.rol;
    const felinos = await CatsService.listarFelinos(rol);
    res.status(200).json({ ok: true, data: felinos });
  } catch (error: any) {
    res.status(500).json({ message: 'Error interno al obtener los felinos.' });
  }
};

export const obtenerFichaFelinoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const rol = req.user?.rol;
    const felino = await CatsService.obtenerPorIdOCodigo(String(id), rol);
    res.status(200).json({ ok: true, data: felino });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Error al consultar la ficha técnica.' });
  }
};

export const actualizarFelinoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const actualizado = await CatsService.actualizarFelino(String(id), req.body);
    res.status(200).json({
      ok: true,
      mensaje: 'Ficha técnica actualizada exitosamente.',
      data: actualizado,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    res.status(500).json({ message: 'Error al actualizar el felino.' });
  }
    
};

export const catalogoPublicoController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const catalogo = await CatsService.obtenerCatalogoPublico();
    res.status(200).json({
      ok: true,
      total: catalogo.length,
      data: catalogo,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error interno al consultar el catálogo público.' });
  }
};