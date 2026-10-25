// tests/public-cats.spec.ts
import request from 'supertest';
import app from '../src/app';
import { closePool, pool } from '../src/config/db';

describe('SCRUM-36 / Catálogo público y verificación de datos sensibles', () => {
  beforeAll(async () => {
    await pool.query(`
      DELETE FROM public.gatos WHERE codigo_felino IN ('PUB-TEST-01', 'PUB-TEST-02', 'PUB-TEST-03');
      INSERT INTO public.gatos (codigo_felino, nombre, peso, edad_meses, estado, foto_url, historia)
      VALUES 
        ('PUB-TEST-01', 'Gato Disponible', 3.5, 10, 'DISPONIBLE', 'https://privada.jpg', 'Gato amigable'),
        ('PUB-TEST-02', 'Gato Cuarentena', 4.0, 15, 'CUARENTENA', 'https://privada2.jpg', 'Bajo tratamiento'),
        ('PUB-TEST-03', 'Gato Adoptado', 3.2, 8, 'ADOPTADO', 'https://privada3.jpg', 'Ya adoptado');
    `);
  }, 15000);

  afterAll(async () => {
    await pool.query("DELETE FROM public.gatos WHERE codigo_felino IN ('PUB-TEST-01', 'PUB-TEST-02', 'PUB-TEST-03')");
    await closePool();
  });

  it('Permite consultar el catálogo sin enviar token de autorización (200 OK)', async () => {
    const res = await request(app).get('/api/public/cats');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('Solo retorna felinos cuyo estado sea estrictamente DISPONIBLE', async () => {
    const res = await request(app).get('/api/public/cats');
    
    const todosDisponibles = res.body.data.every((cat: any) => cat.estado === 'DISPONIBLE');
    expect(todosDisponibles).toBe(true);
    const codigos = res.body.data.map((cat: any) => cat.codigoFelino);
    expect(codigos).toContain('PUB-TEST-01');
    expect(codigos).not.toContain('PUB-TEST-02');
    expect(codigos).not.toContain('PUB-TEST-03');
  });

  it('Inspecciona el payload y certifica que NO se expone ningún dato sensible o clínico', async () => {
    const res = await request(app).get('/api/public/cats');
    const felinos = res.body.data;
    const camposProhibidos = [
      'foto_url',
      'fotoUrl',
      'created_by',
      'createdBy',
      'observaciones',
      'nombre_institucion',
      'nombreInstitucion',
      'fecha_derivacion',
      'fechaDerivacion',
      'historial_medico',
      'vacunas',
      'tratamiento',
    ];

    felinos.forEach((cat: any) => {
      camposProhibidos.forEach((campo) => {
        expect(cat).not.toHaveProperty(campo);
      });
    });
  });
});