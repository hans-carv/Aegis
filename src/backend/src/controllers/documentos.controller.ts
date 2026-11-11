import { Request, Response } from 'express';
import { DocumentosService, DocumentosPayload } from '../services/documentos.service';

export const subirDocumentosController = async (req: Request, res: Response): Promise<void> => {
  try {
    const usuarioId = req.user?.id;
    if (!usuarioId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const postulacionId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const files = req.files as DocumentosPayload;

    const data = await DocumentosService.subirDocumentos(postulacionId, usuarioId, files);
    res.status(201).json({
      ok: true,
      mensaje: 'Documentos cifrados con AES-256 y resguardados exitosamente.',
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN SUBIR DOCUMENTOS:', error);
    res.status(500).json({ message: error.message || 'Error interno al procesar los documentos.' });
  }
};

export const verDocumentoAdminController = async (req: Request, res: Response): Promise<void> => {
  try {
    const documentoId = Array.isArray(req.params.docId) ? req.params.docId[0] : (req.params.docId as string);

    const doc = await DocumentosService.descargarODesencriptarDocumento(documentoId);
    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.nombreArchivo}"`);
    res.status(200).send(doc.buffer);
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN VISOR DOCUMENTO ADMIN:', error);
    res.status(500).json({ message: 'Error al desencriptar el documento.' });
  }
};