import PDFDocument from 'pdfkit';
import { query } from '../config/db';
import { FileEncryptionService } from './fileEncryption.service';

export class ContratoAdopcionService {
  static async generarContratoPdf(identificadorId: string): Promise<{
    buffer: Buffer;
    filename: string;
    adopcionId: string;
  }> {
    const res = await query(
      `SELECT 
         af.id AS adopcion_id,
         af.postulacion_id,
         af.direccion_tenencia,
         af.telefono_tenencia,
         af.fecha_adopcion,
         u.nombre_completo AS adoptante_nombre,
         COALESCE(u.ci, 'S/N - Verificar en Expediente') AS adoptante_ci,
         u.email AS adoptante_email,
         g.nombre AS gato_nombre,
         g.codigo_felino,
         g.esterilizado,
         g.resultado_vif,
         g.resultado_vilef,
         (
           SELECT v.dictamen
           FROM public.visitas_domiciliarias v
           WHERE v.postulacion_id = p.id
           ORDER BY v.created_at DESC
           LIMIT 1
         ) AS dictamen_visita
       FROM public.postulaciones_adopcion p
       JOIN public.usuarios u ON p.usuario_id = u.id
       JOIN public.gatos g ON p.gato_id = g.id
       LEFT JOIN public.adopciones_formales af ON af.postulacion_id = p.id
       WHERE af.id = $1 OR p.id = $1
       LIMIT 1`,
      [identificadorId]
    );

    if (res.rows.length === 0) {
      throw { status: 404, message: 'No se encontró el trámite o adopción solicitada.' };
    }

    const exp = res.rows[0];

    if (exp.dictamen_visita !== 'APROBADA') {
      throw {
        status: 409,
        message: `Bloqueo de contrato PDF: la visita domiciliaria debe tener dictamen APROBADA (estado actual: '${exp.dictamen_visita || 'SIN_DICTAMEN'}').`,
      };
    }

    if (!exp.adopcion_id) {
      throw {
        status: 409,
        message: 'La postulación aún no ha sido consolidada en adopciones_formales.',
      };
    }

    await query(
      `UPDATE public.adopciones_formales
       SET contrato_generado_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [exp.adopcion_id]
    );

    const buffer = await this.construirBufferPdf(exp);
    const filename = `Contrato_Adopcion_${exp.codigo_felino}_${exp.adopcion_id.slice(0, 8)}.pdf`;

    return {
      buffer,
      filename,
      adopcionId: exp.adopcion_id,
    };
  }

  private static construirBufferPdf(exp: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50, size: 'A4', compress: false });
        const chunks: Buffer[] = [];

        doc.on('data', (chunk: Buffer) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', (err: Error) => reject(err));

        const fechaEmision = new Date().toLocaleDateString('es-BO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        doc
          .fontSize(16)
          .font('Helvetica-Bold')
          .text('AEGIS - PROYECTO TEOCAT', { align: 'center' })
          .moveDown(0.3);

        doc
          .fontSize(12)
          .text('CONTRATO LEGAL DE ADOPCIÓN RESPONSABLE Y TENENCIA DE FELINO', { align: 'center' })
          .moveDown(0.5);

        doc
          .fontSize(9)
          .font('Helvetica')
          .text(`N° de Expediente: ${exp.adopcion_id}  |  Fecha de Emisión: ${fechaEmision}`, {
            align: 'center',
          })
          .moveDown(1.2);

        doc.fontSize(11).font('Helvetica-Bold').text('I. DATOS DEL ADOPTANTE RESPONSABLE').moveDown(0.4);
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Nombre Completo: ${exp.adoptante_nombre}`)
          .text(`Cédula de Identidad (CI): ${exp.adoptante_ci}`)
          .text(`Dirección de Tenencia Verificada: ${exp.direccion_tenencia}`)
          .text(`Teléfono de Contacto: ${exp.telefono_tenencia}`)
          .text(`Correo Electrónico: ${exp.adoptante_email}`)
          .moveDown(1);

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('II. IDENTIFICACIÓN Y CARACTERÍSTICAS DEL FELINO')
          .moveDown(0.4);
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Nombre del Felino: ${exp.gato_nombre}`)
          .text(`Código Alfanumérico Único: ${exp.codigo_felino}`)
          .text(`Estado de Esterilización: ${exp.esterilizado ? 'Esterilizado/a' : 'Compromiso de esterilización'}`)
          .text(
            `Perfil Sanitario Viral: VIF (${exp.resultado_vif || 'NEGATIVO'}) / ViLeF (${exp.resultado_vilef || 'NEGATIVO'})`
          )
          .moveDown(1);

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('III. CLÁUSULAS LEGALES DE TENENCIA Y SEGUIMIENTO')
          .moveDown(0.4);

        const clausulas = [
          'PRIMERA (Objeto y Tenencia): El Albergue Aegis entrega en adopción definitiva al felino identificado en la Cláusula II, comprometiéndose el Adoptante a brindarle alojamiento exclusivamente interior (indoor), alimentación adecuada y atención veterinaria oportuna.',
          'SEGUNDA (Seguridad del Hogar): El Adoptante se obliga a mantener instaladas y en buen estado las mallas de protección en ventanas, balcones y patios inspeccionados durante la visita domiciliaria aprobada.',
          'TERCERA (Seguimiento Post-Adopción): El Albergue Aegis se reserva el derecho de realizar visitas o solicitar reportes fotográficos periódicos de seguimiento para verificar el bienestar físico y emocional del ejemplar.',
          'CUARTA (Prohibición de Abandono o Transferencia): Queda terminantemente prohibido vender, regalar, abandonar o transferir la tenencia del felino a terceros sin autorización escrita del Albergue.',
        ];

        doc.fontSize(9.5).font('Helvetica');
        for (const clausula of clausulas) {
          doc.text(clausula, { align: 'justify' }).moveDown(0.5);
        }

        doc.moveDown(1.5);

        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('____________________________                    ____________________________', {
            align: 'center',
          })
          .text('   Firma del Adoptante Legal                       Administración Aegis / TeoCat', {
            align: 'center',
          });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  static async registrarContratoFirmado(
    adopcionId: string,
    file?: Express.Multer.File,
    contratoUrlManual?: string
  ) {
    const checkRes = await query(
      'SELECT id, estado_vinculo FROM public.adopciones_formales WHERE id = $1 OR postulacion_id = $1 LIMIT 1',
      [adopcionId]
    );

    if (checkRes.rows.length === 0) {
      throw { status: 404, message: 'Registro de adopción formal no encontrado.' };
    }

    const realAdopcionId = checkRes.rows[0].id;

    let rutaAlmacenada: string | null = null;

    if (file) {
      const stored = FileEncryptionService.encryptAndStore(file.buffer, file.originalname);
      rutaAlmacenada = stored.rutaCifrada;
    } else if (contratoUrlManual && contratoUrlManual.trim().length > 0) {
      rutaAlmacenada = contratoUrlManual.trim();
    }

    if (!rutaAlmacenada) {
      throw {
        status: 400,
        message: 'Debes adjuntar el archivo PDF/imagen del contrato firmado o proporcionar contratoFirmadoUrl.',
      };
    }

    const updateRes = await query(
      `UPDATE public.adopciones_formales
       SET contrato_firmado_url = $1
       WHERE id = $2
       RETURNING 
         id,
         postulacion_id AS "postulacionId",
         gato_id AS "gatoId",
         contrato_generado_at AS "contratoGeneradoAt",
         contrato_firmado_url AS "contratoFirmadoUrl"`,
      [rutaAlmacenada, realAdopcionId]
    );

    return updateRes.rows[0];
  }
}