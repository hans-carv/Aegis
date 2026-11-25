import { Request, Response } from 'express';
import { InmunizacionesService } from '../services/inmunizaciones.service';

export const registrarInmunizacionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const gatoId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const data = await InmunizacionesService.registrarControl(gatoId, usuarioId, req.body);

    res.status(201).json({
      ok: true,
      mensaje: 'Control inmunológico registrado exitosamente.',
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN REGISTRAR INMUNIZACION:', error);
    res.status(500).json({ message: error.message || 'Error interno al registrar el control clínico.' });
  }
};

export const listarInmunizacionesController = async (req: Request, res: Response): Promise<void> => {
  try {
    const gatoId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const data = await InmunizacionesService.listarHistorialPorGato(gatoId);

    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN LISTAR INMUNIZACIONES:', error);
    res.status(500).json({ message: 'Error interno al consultar el historial clínico.' });
  }
};