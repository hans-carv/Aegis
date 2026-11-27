import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db';

describe('HU: Emisión y descarga de contrato legal de adopción en PDF', () => {
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';
  let adminToken: string;
  let userId: string;
  let gatoAprobadoId: string;
  let gatoNoAprobadoId: string;
  let postulacionAprobadaId: string;
  let postulacionNoAprobadaId: string;
  let adopcionAprobadaId: string;

  beforeAll(async () => {
    const userRes = await query('SELECT id, nombre_completo FROM public.usuarios LIMIT 1');
    userId = userRes.rows[0]?.id;
    adminToken = jwt.sign({ id: userId, email: 'admin@teocat.bo', rol: 'ADMIN' }, secret);

    await query(`UPDATE public.usuarios SET ci = COALESCE(ci, '8451290 LP') WHERE id = $1`, [userId]);

    // 1. Expediente APROBADO y vinculado formalmente
    const g1 = await query(`
      INSERT INTO public.gatos (nombre, codigo_felino, estado, esterilizado)
      VALUES ('Cleo Contrato', 'CONT-OK-${Date.now()}', 'ADOPTADO', TRUE)
      RETURNING id;
    `);
    gatoAprobadoId = g1.rows[0].id;

    const p1 = await query(`
      INSERT INTO public.postulaciones_adopcion
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio, documentacion_completa)
      VALUES ($1, $2, 'APROBADA_FINALIZADA', '{}', 400, '77712345', 'Zona Sur Calacoto Calle 18 #250', TRUE)
      RETURNING id;
    `, [userId, gatoAprobadoId]);
    postulacionAprobadaId = p1.rows[0].id;

    await query(`
      INSERT INTO public.visitas_domiciliarias
        (postulacion_id, evaluador_id, fecha_visita, hora_inicio, hora_fin, direccion_confirmada, estado, dictamen, observaciones_dictamen)
      VALUES ($1, $2, '2026-12-20', '10:00', '11:00', 'Zona Sur Calacoto Calle 18 #250', 'REALIZADA', 'APROBADA', 'Vivienda segura.')
    `, [postulacionAprobadaId, userId]);

    const af1 = await query(`
      INSERT INTO public.adopciones_formales
        (postulacion_id, gato_id, adoptante_id, administrador_id, direccion_tenencia, telefono_tenencia, estado_vinculo)
      VALUES ($1, $2, $3, $3, 'Zona Sur Calacoto Calle 18 #250', '77712345', 'VIGENTE')
      RETURNING id;
    `, [postulacionAprobadaId, gatoAprobadoId, userId]);
    adopcionAprobadaId = af1.rows[0].id;

    // 2. Trámite cuya visita domiciliaria NO fue APROBADA (PENDIENTE_ADECUACIONES)
    const g2 = await query(`
      INSERT INTO public.gatos (nombre, codigo_felino, estado)
      VALUES ('Toby Pendiente', 'CONT-NO-${Date.now()}', 'ADOPCION')
      RETURNING id;
    `);
    gatoNoAprobadoId = g2.rows[0].id;

    const p2 = await query(`
      INSERT INTO public.postulaciones_adopcion
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio, documentacion_completa)
      VALUES ($1, $2, 'PENDIENTE_ADECUACIONES', '{}', 300, '77754321', 'Miraflores Calle 5', TRUE)
      RETURNING id;
    `, [userId, gatoNoAprobadoId]);
    postulacionNoAprobadaId = p2.rows[0].id;

    await query(`
      INSERT INTO public.visitas_domiciliarias
        (postulacion_id, evaluador_id, fecha_visita, hora_inicio, hora_fin, direccion_confirmada, estado, dictamen, observaciones_dictamen)
      VALUES ($1, $2, '2026-12-21', '10:00', '11:00', 'Miraflores Calle 5', 'REALIZADA', 'PENDIENTE_ADECUACIONES', 'Falta malla.')
    `, [postulacionNoAprobadaId, userId]);
  });

  afterAll(async () => {
    const postIds = [postulacionAprobadaId, postulacionNoAprobadaId].filter(Boolean);
    const gatoIds = [gatoAprobadoId, gatoNoAprobadoId].filter(Boolean);

    if (gatoIds.length > 0) {
      await query('DELETE FROM public.adopciones_formales WHERE gato_id = ANY($1::uuid[])', [gatoIds]);
    }
    if (postIds.length > 0) {
      await query('DELETE FROM public.visitas_domiciliarias WHERE postulacion_id = ANY($1::uuid[])', [postIds]);
      await query('DELETE FROM public.postulaciones_adopcion WHERE id = ANY($1::uuid[])', [postIds]);
    }
    if (gatoIds.length > 0) {
      await query('DELETE FROM public.gatos WHERE id = ANY($1::uuid[])', [gatoIds]);
    }
    await pool.end();
  });

  // DoD 1 & DoD 2: Respuesta 200 OK con Content-Type: application/pdf y datos autocompletados
  it('DoD 1 y 2: Genera y descarga el contrato PDF (200 OK, application/pdf) con datos del adoptante, felino y cláusulas', async () => {
    const res = await request(app)
      .get(`/api/admin/adopciones/${adopcionAprobadaId}/contrato-pdf`)
      .set('Authorization', `Bearer ${adminToken}`)
      .buffer(true)
      .parse((res, callback) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/pdf/);

    const pdfRaw = res.body.toString('latin1');
    expect(pdfRaw.startsWith('%PDF-')).toBe(true);

    // Decodificar bloques hexadecimales <...> emitidos por PDFKit para validar texto inyectado
    const textoExtraido = (pdfRaw.match(/<([0-9A-Fa-f]+)>/g) || [])
      .map((hex: string) => Buffer.from(hex.slice(1, -1), 'hex').toString('latin1'))
      .join('');

    expect(textoExtraido).toContain('Cleo Contrato');
    expect(textoExtraido).toContain('Zona Sur Calacoto Calle 18 #250');
    expect(textoExtraido).toContain('PRIMERA');
  });

  // DoD 3: Bloqueo 409 Conflict si la visita domiciliaria no fue APROBADA
  it('DoD 3: Bloquea con 409 Conflict si se solicita contrato de una solicitud sin dictamen APROBADA', async () => {
    const res = await request(app)
      .get(`/api/admin/adopciones/${postulacionNoAprobadaId}/contrato-pdf`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/APROBADA/i);
  });

  // DoD 4: Adjuntar y almacenar copia escaneada o firmada digitalmente (200 OK)
  it('DoD 4: Permite adjuntar y almacenar la copia firmada del contrato retornando 200 OK', async () => {
    const fakeSignedPdf = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF');

    const res = await request(app)
      .post(`/api/admin/adopciones/${adopcionAprobadaId}/contrato-firmado`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('contrato', fakeSignedPdf, {
        filename: 'contrato_firmado_cleo.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.contratoFirmadoUrl).toBeDefined();
    expect(res.body.data.contratoGeneradoAt).not.toBeNull();
  });
});