import { Request, Response } from 'express';
import { ReservasService } from '../services/reservas.service';

export const consultarDisponibilidadController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fecha } = req.query;
    if (!fecha) {
      res.status(400).json({ message: 'El parámetro de consulta ?fecha=YYYY-MM-DD es obligatorio.' });
      return;
    }

    const data = await ReservasService.consultarDisponibilidad(String(fecha));
    res.status(200).json({ ok: true, data });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error al consultar disponibilidad.' });
  }
};

export const crearReservaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const resultado = await ReservasService.crearReserva(usuarioId, req.body);
    res.status(201).json({
      ok: true,
      mensaje: 'Reserva registrada con éxito.',
      data: resultado,
    });
  } catch (error: any) {
    res.status(error.status || 500).json({ message: error.message || 'Error al procesar reserva.' });
  }
};

export const listarMisReservasController = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const data = await ReservasService.listarMisReservas(usuarioId);
    res.status(200).json({ ok: true, data });
  } catch (error: any) {
    res.status(500).json({ message: 'Error al listar reservas.' });
  }
};
