// tests/documentos.spec.ts
import request from 'supertest';
import app from '../src/app';
import jwt from 'jsonwebtoken';
import { pool, query } from '../src/config/db';
import fs from 'fs';
import path from 'path';

describe('HU: Subida y resguardo cifrado (AES-256) de documentos (SCRUM-60)', () => {
  const secret = process.env.JWT_SECRET || 'aegis_teocat_super_secret_key_2026';
  let userToken: string;
  let adminToken: string;
  let postulacionId: string;
  let documentoCreadoId: string;

  beforeAll(async () => {
    const userRes = await query('SELECT id FROM public.usuarios LIMIT 1');
    const userId = userRes.rows[0]?.id;
    userToken = jwt.sign({ id: userId, email: 'postulante@teocat.bo', rol: 'USUARIO' }, secret);
    adminToken = jwt.sign({ id: userId, email: 'admin@teocat.bo', rol: 'ADMIN' }, secret);

    const gatoRes = await query('SELECT id FROM public.gatos LIMIT 1');
    const gatoId = gatoRes.rows[0]?.id;

    const postRes = await query(`
      INSERT INTO public.postulaciones_adopcion 
        (usuario_id, gato_id, estado, cuestionario_vivienda, presupuesto_mensual, telefono_contacto, direccion_domicilio)
      VALUES ($1, $2, 'EN_REVISION', '{}', 200, '77712345', 'Av. Test 123')
      RETURNING id;
    `, [userId, gatoId]);

    postulacionId = postRes.rows[0].id;
  });

  afterAll(async () => {
    if (postulacionId) {
      const docs = await query('SELECT ruta_cifrada FROM public.documentos_postulacion WHERE postulacion_id = $1', [postulacionId]);
      docs.rows.forEach((r: any) => {
        if (fs.existsSync(r.ruta_cifrada)) {
          fs.unlinkSync(r.ruta_cifrada);
        }
      });
      await query('DELETE FROM public.documentos_postulacion WHERE postulacion_id = $1', [postulacionId]);
      await query('DELETE FROM public.postulaciones_adopcion WHERE id = $1', [postulacionId]);
    }
    await pool.end();
  });

  it('DoD 2a: Debe rechazar con 400 Bad Request ante intentos de subir ejecutables (.exe)', async () => {
    const fakeExeBuffer = Buffer.from('MZ... executable content');

    const res = await request(app)
      .post(`/api/postulaciones/${postulacionId}/documentos`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('carnetIdentidad', fakeExeBuffer, 'virus.exe')
      .attach('facturaServicio', Buffer.from('factura dummy'), 'factura.pdf')
      .attach('croquisDomicilio', Buffer.from('croquis dummy'), 'croquis.png');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Formato no permitido/i);
  });

  it('DoD 2b: Debe rechazar con 413 Payload Too Large si un archivo supera los 5 MB', async () => {
    const bigBuffer = Buffer.alloc(5.5 * 1024 * 1024); // 5.5 MB

    const res = await request(app)
      .post(`/api/postulaciones/${postulacionId}/documentos`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('carnetIdentidad', bigBuffer, 'carnet_pesado.pdf')
      .attach('facturaServicio', Buffer.from('factura dummy'), 'factura.pdf')
      .attach('croquisDomicilio', Buffer.from('croquis dummy'), 'croquis.png');

    expect(res.status).toBe(413);
    expect(res.body.message).toMatch(/5 MB/i);
  });

  it('DoD 1 y 4: Cifra los 3 archivos con AES-256, marca documentacion_completa y retorna 201 Created', async () => {
    const dummyPdf = Buffer.from('%PDF-1.4 documento valido');
    const dummyJpg = Buffer.from('fake jpg image data');
    const dummyPng = Buffer.from('fake png image data');

    const res = await request(app)
      .post(`/api/postulaciones/${postulacionId}/documentos`)
      .set('Authorization', `Bearer ${userToken}`)
      .attach('carnetIdentidad', dummyPdf, 'carnet.pdf')
      .attach('facturaServicio', dummyJpg, 'luz.jpg')
      .attach('croquisDomicilio', dummyPng, 'croquis.png');

    expect(res.status).toBe(201);
    expect(res.body.ok).toBe(true);
    expect(res.body.data.documentacionCompleta).toBe(true);
    expect(res.body.data.documentos.length).toBe(3);

    const checkPost = await query('SELECT documentacion_completa FROM public.postulaciones_adopcion WHERE id = $1', [postulacionId]);
    expect(checkPost.rows[0].documentacion_completa).toBe(true);

    documentoCreadoId = res.body.data.documentos[0].id;
  });

  it('DoD 3: Debe retornar 403 Forbidden a usuarios comunes que intenten ver/descargar el documento', async () => {
    const res = await request(app)
      .get(`/api/postulaciones/admin/visor/${documentoCreadoId}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
  });

  it('DoD 3b: Permite acceso y desencripta el archivo si el solicitante es ADMIN', async () => {
    const res = await request(app)
      .get(`/api/postulaciones/admin/visor/${documentoCreadoId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.header['content-type']).toContain('application/pdf');
    expect(res.body.toString()).toContain('%PDF-1.4 documento valido');
  });
});