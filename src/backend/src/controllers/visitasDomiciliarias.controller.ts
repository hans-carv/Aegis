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

export const obtenerVisitaPorPostulacionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const postulacionId = Array.isArray(req.params.postulacionId)
      ? req.params.postulacionId[0]
      : (req.params.postulacionId as string);

    const data = await VisitasDomiciliariasService.obtenerVisitaPorPostulacion(
      postulacionId,
      usuarioId,
      req.user?.rol
    );

    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN OBTENER VISITA POR POSTULACION:', error);
    res.status(500).json({ message: 'Error interno al consultar la visita de la postulación.' });
  }
};

export const emitirDictamenVisitaController = async (req: Request, res: Response): Promise<void> => {
  try {
    const visitaId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const data = await VisitasDomiciliariasService.emitirDictamen(visitaId, req.body);

    res.status(200).json({
      ok: true,
      mensaje: `Dictamen '${data.visita.dictamen}' registrado exitosamente.`,
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN EMITIR DICTAMEN VISITA:', error);
    res.status(500).json({ message: error.message || 'Error interno al emitir el dictamen.' });
  }
};

export const subirEvidenciaAdecuacionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const visitaId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const data = await VisitasDomiciliariasService.registrarEvidenciaAdecuacion(
      visitaId,
      usuarioId,
      req.body.evidenciaUrls
    );

    res.status(200).json({
      ok: true,
      mensaje: 'Evidencia fotográfica de adecuaciones registrada.',
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN SUBIR EVIDENCIA ADECUACION:', error);
    res.status(500).json({ message: 'Error interno al registrar evidencia.' });
  }
};

export const verificarContratoPostulacionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const postulacionId = Array.isArray(req.params.postulacionId)
      ? req.params.postulacionId[0]
      : (req.params.postulacionId as string);

    const data = await VisitasDomiciliariasService.validarHabilitadoParaContrato(postulacionId);

    res.status(200).json({
      ok: true,
      mensaje: 'Postulación habilitada para generación de contrato.',
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN VERIFICAR CONTRATO:', error);
    res.status(500).json({ message: 'Error interno al validar elegibilidad de contrato.' });
  }
};