import { Request, Response } from 'express';
import { ContratoAdopcionService } from '../services/contratoAdopcion.service';

export const descargarContratoPdfController = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const { buffer, filename } = await ContratoAdopcionService.generarContratoPdf(id);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);
    res.status(200).send(buffer);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN GENERAR CONTRATO PDF:', error);
    res.status(500).json({ message: error.message || 'Error interno al generar el contrato PDF.' });
  }
};

export const subirContratoFirmadoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const data = await ContratoAdopcionService.registrarContratoFirmado(
      id,
      req.file,
      req.body?.contratoFirmadoUrl
    );

    res.status(200).json({
      ok: true,
      mensaje: 'Copia del contrato firmado almacenada correctamente.',
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN SUBIR CONTRATO FIRMADO:', error);
    res.status(500).json({ message: error.message || 'Error interno al registrar el contrato firmado.' });
  }
};