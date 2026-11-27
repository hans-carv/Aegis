import { Request, Response } from 'express';
import { AdopcionesFormalesService } from '../services/adopcionesFormales.service';

export const vincularAdopcionController = async (req: Request, res: Response): Promise<void> => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      res.status(401).json({ message: 'Usuario no autenticado.' });
      return;
    }

    const data = await AdopcionesFormalesService.vincularAdoptanteYFelino(adminId, req.body);

    res.status(201).json({
      ok: true,
      mensaje: 'Vínculo formal de adopción registrado con éxito y felino marcado como ADOPTADO.',
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN VINCULAR ADOPCION:', error);
    res.status(500).json({ message: error.message || 'Error interno al vincular la adopción.' });
  }
};

export const obtenerFichaAdminGatoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const gatoId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const data = await AdopcionesFormalesService.obtenerFichaAdministrativaGato(gatoId);

    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error: any) {
    if (error.status) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    console.error('ERROR EN OBTENER FICHA ADMIN GATO:', error);
    res.status(500).json({ message: 'Error interno al consultar la ficha administrativa del felino.' });
  }
};

export const listarAdopcionesController = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await AdopcionesFormalesService.listarAdopcionesFormales();
    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error: any) {
    console.error('ERROR EN LISTAR ADOPCIONES FORMALES:', error);
    res.status(500).json({ message: 'Error interno al consultar el directorio de adoptantes.' });
  }
};