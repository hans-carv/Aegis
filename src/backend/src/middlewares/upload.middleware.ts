import multer, { FileFilterCallback } from 'multer';
import { Request, Response, NextFunction } from 'express';

const storage = multer.memoryStorage();

const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const ext = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('FORMATO_NO_PERMITIDO'));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB por archivo
  },
  fileFilter,
});

export const uploadDocumentosPostulacion = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const uploadFields = upload.fields([
    { name: 'carnetIdentidad', maxCount: 1 },
    { name: 'facturaServicio', maxCount: 1 },
    { name: 'croquisDomicilio', maxCount: 1 },
  ]);

  uploadFields(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          message: 'Uno o más archivos superan el límite permitido de 5 MB.',
        });
        return;
      }
      res.status(400).json({ message: `Error en la subida de archivos: ${err.message}` });
      return;
    } else if (err) {
      if (err.message === 'FORMATO_NO_PERMITIDO') {
        res.status(400).json({
          message: 'Formato no permitido. Solo se aceptan archivos PDF, JPG y PNG.',
        });
        return;
      }
      res.status(400).json({ message: err.message });
      return;
    }
    next();
  });
};