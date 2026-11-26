import { Request, Response } from 'express';
import { VisitasDomiciliariasService } from '../services/visitasDomiciliarias.service';

export const agendarVisitaDomiciliariaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const data = await VisitasDomiciliariasService.agendarVisita(adminId, req.body);

    res.status(201).json({
      ok: true,
      mensaje: 'Visita domiciliaria agendada exitosamente y postulación actualizada a VISITA_PROGRAMADA.',
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN AGENDAR VISITA DOMICILIARIA:', error);
    res.status(500).json({ message: error.message || 'Error interno al agendar la visita domiciliaria.' });
  }
};

export const listarAgendaVisitasController = async (req: Request, res: Response): Promise<void> => {
  try {
    const fecha = typeof req.query.fecha === 'string' ? req.query.fecha : undefined;
    const data = await VisitasDomiciliariasService.listarAgendaVisitas(fecha);

    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error: any) {
    console.error('ERROR EN LISTAR AGENDA VISITAS:', error);
    res.status(500).json({ message: 'Error interno al consultar la agenda de visitas.' });
  }
};