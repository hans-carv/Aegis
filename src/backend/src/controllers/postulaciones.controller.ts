// src/controllers/postulaciones.controller.ts
import { Request, Response } from 'express';
import { PostulacionesService } from '../services/postulaciones.service';

export const crearPostulacionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const postulacion = await PostulacionesService.crearPostulacion(usuarioId, req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Postulación registrada exitosamente en estado EN_REVISION.',
      data: postulacion,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }

    console.error('ERROR EN CREAR POSTULACION:', error);
    res.status(500).json({ message: error.message || 'Error interno al procesar la postulación.' });
  }
};

export const bloquearModificacionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    void id;
    await PostulacionesService.rechazarModificacionInmutable();
  } catch (error: any) {
    res.status(error.status || 403).json({ message: error.message });
  }
};

export const listarPostulacionesAdminController = async (req: Request, res: Response): Promise<void> => {
  try {
    const gatoId = typeof req.query.gatoId === 'string' ? req.query.gatoId : undefined;
    const fecha = typeof req.query.fecha === 'string' ? req.query.fecha : undefined;

    const data = await PostulacionesService.listarPostulacionesAdmin({ gatoId, fecha });
    res.status(200).json({ ok: true, data });
  } catch (error: any) {
    console.error('ERROR EN LISTAR POSTULACIONES ADMIN:', error);
    res.status(500).json({ message: 'Error interno al listar las postulaciones.' });
  }
};