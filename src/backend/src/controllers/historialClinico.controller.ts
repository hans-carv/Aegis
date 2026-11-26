import { Request, Response } from 'express';
import { HistorialClinicoService } from '../services/historialClinico.service';

export const registrarTratamientoClinicoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const gatoId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const data = await HistorialClinicoService.registrarProcedimiento(gatoId, adminId, req.body);

    res.status(201).json({
      ok: true,
      mensaje: 'Procedimiento clínico registrado y estado sanitario actualizado.',
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN REGISTRAR TRATAMIENTO CLINICO:', error);
    res.status(500).json({ message: error.message || 'Error interno al registrar el procedimiento clínico.' });
  }
};

export const consultarExpedienteClinicoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const gatoId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const data = await HistorialClinicoService.obtenerExpedienteClinico(gatoId);

    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN CONSULTAR EXPEDIENTE CLINICO:', error);
    res.status(500).json({ message: 'Error interno al consultar el expediente clínico.' });
  }
};