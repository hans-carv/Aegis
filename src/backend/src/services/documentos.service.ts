import { pool, query } from '../config/db';
import { FileEncryptionService } from './fileEncryption.service';

export interface DocumentosPayload {
  carnetIdentidad?: Express.Multer.File[];
  facturaServicio?: Express.Multer.File[];
  croquisDomicilio?: Express.Multer.File[];
}

export class DocumentosService {
  static async subirDocumentos(
    postulacionId: string,
    usuarioId: string,
    files: DocumentosPayload
  ) {
    const postRes = await query(
      'SELECT id, usuario_id, estado FROM public.postulaciones_adopcion WHERE id = $1',
      [postulacionId]
    );

    if (postRes.rows.length === 0) {
      throw { status: 404, message: 'La postulación no existe.' };
    }

    if (postRes.rows[0].usuario_id !== usuarioId) {
      throw { status: 403, message: 'No tienes autorización para adjuntar documentos en esta postulación.' };
    }

    const carnet = files.carnetIdentidad?.[0];
    const factura = files.facturaServicio?.[0];
    const croquis = files.croquisDomicilio?.[0];

    if (!carnet || !factura || !croquis) {
      throw {
        status: 400,
        message: 'Debes adjuntar obligatoriamente los 3 documentos: carnetIdentidad, facturaServicio y croquisDomicilio.',
      };
    }

    const items = [
      { tipo: 'CARNET_IDENTIDAD', file: carnet },
      { tipo: 'FACTURA_SERVICIO', file: factura },
      { tipo: 'CROQUIS_DOMICILIO', file: croquis },
    ];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const guardados = [];

      for (const item of items) {
        const encData = FileEncryptionService.encryptAndStore(item.file.buffer, item.file.originalname);

        const sql = `
          INSERT INTO public.documentos_postulacion 
            (postulacion_id, tipo_documento, nombre_archivo_original, mime_type, ruta_cifrada, iv_vector, hash_sha256, tamano_bytes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (postulacion_id, tipo_documento) 
          DO UPDATE SET 
            nombre_archivo_original = EXCLUDED.nombre_archivo_original,
            mime_type = EXCLUDED.mime_type,
            ruta_cifrada = EXCLUDED.ruta_cifrada,
            iv_vector = EXCLUDED.iv_vector,
            hash_sha256 = EXCLUDED.hash_sha256,
            tamano_bytes = EXCLUDED.tamano_bytes,
            created_at = CURRENT_TIMESTAMP
          RETURNING id, tipo_documento, nombre_archivo_original, hash_sha256;
        `;

        const resDoc = await client.query(sql, [
          postulacionId,
          item.tipo,
          item.file.originalname,
          item.file.mimetype,
          encData.rutaCifrada,
          encData.iv,
          encData.hashSha256,
          encData.tamanoBytes,
        ]);
        guardados.push(resDoc.rows[0]);
      }

      await client.query(
        'UPDATE public.postulaciones_adopcion SET documentacion_completa = TRUE WHERE id = $1',
        [postulacionId]
      );

      await client.query('COMMIT');

      return {
        postulacionId,
        documentacionCompleta: true,
        documentos: guardados,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async descargarODesencriptarDocumento(documentoId: string) {
    const res = await query(
      `SELECT id, nombre_archivo_original, mime_type, ruta_cifrada, iv_vector, hash_sha256 
       FROM public.documentos_postulacion 
       WHERE id = $1`,
      [documentoId]
    );

    if (res.rows.length === 0) {
      throw { status: 404, message: 'Documento no encontrado.' };
    }

    const doc = res.rows[0];
    const decryptedBuffer = FileEncryptionService.decryptFile(doc.ruta_cifrada, doc.iv_vector);

    return {
      buffer: decryptedBuffer,
      mimeType: doc.mime_type,
      nombreArchivo: doc.nombre_archivo_original,
    };
  }
}