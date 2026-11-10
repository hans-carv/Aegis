import { Request, Response } from 'express';
import { HorariosService } from '../services/horarios.service';

export const crearHorarioController = async (req: Request, res: Response): Promise<void> => {
  try {
    const nuevaFranja = await HorariosService.crearFranja(req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Franja horaria creada exitosamente.',
      data: nuevaFranja,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error al configurar horario.' });
  }
};

export const actualizarHorarioController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const actualizada = await HorariosService.actualizarFranja(id, req.body);
    res.status(200).json({
      ok: true,
      mensaje: 'Franja horaria actualizada correctamente.',
      data: actualizada,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error al actualizar franja.' });
  }
};

export const listarHorariosController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const horarios = await HorariosService.listarFranjas();
    res.status(200).json({ ok: true, data: horarios });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al obtener horarios.' });
  }
};