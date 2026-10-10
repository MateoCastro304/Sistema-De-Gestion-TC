import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aSupplier } from '../../../shared/factories/supplier-factory';

/**
 * Contrato HTTP de POST /suppliers.
 *
 * Los 400 de forma los produce el ValidationPipe global, que responde con el
 * formato por defecto de Nest: { statusCode, message: string[], error }. Los
 * errores de dominio pasan por DomainErrorFilter, que agrega `field` y `value`
 * en los 409. Ninguno de los dos trae `path` ni `timestamp`, a diferencia de
 * fabricas y encargados (ver B-07 y B-18 en docs/pendientes-sprint-1.md).
 */
describe('POST /suppliers', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().supplier.deleteMany(); // limpieza de datos, no del container
  });

  it('201 Supplier created successfully', async () => {
    const payload = aSupplier();

    const response = await request(app.getHttpServer()).post('/suppliers').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      legalName: payload.legalName,
      supplierType: 'MATERIAL',
      active: true,
      createdAt: expect.any(String),
      updatedAt: expect.any(String),
    });
    // El CUIT vuelve formateado con guiones, aunque se guarde sin ellos.
    expect(response.body.cuit).toBe(payload.cuit);
  });

  it('400 legalName missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ legalName: undefined }));

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('legalName');
  });

  it('400 legalName over 80 characters', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ legalName: 'a'.repeat(81) }));

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('legalName');
  });

  it('400 supplierType missing', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ supplierType: undefined }));

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('supplierType');
  });

  it('400 unknown supplierType', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ supplierType: 'procc' }));

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('supplierType');
  });

  it('400 cuit with a malformed pattern', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ cuit: '3046033121-2' }));

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('cuit');
  });

  it('400 cuit that is not a number at all', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ cuit: 'e-stonoesuncu-it' }));

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('cuit');
  });

  it('400 cuit well formed but with an invalid check digit', async () => {
    // Pasa el patron del DTO y lo rechaza el value object Cuit, asi que el 400
    // sale del DomainErrorFilter y no del ValidationPipe: trae `message` como
    // string, no como arreglo.
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ cuit: '30-70987654-3' }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      error: 'Bad Request',
      message: 'CUIT check digit is invalid',
    });
  });

  it('400 invalid contactEmail', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ contactEmail: 'not.valid@' }));

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('contactEmail');
  });

  it('400 unknown property', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send({ ...aSupplier(), nonExistentField: 'foo' });

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('nonExistentField');
  });

  it('409 duplicate legalName, reporting the offending field', async () => {
    const payload = aSupplier({ legalName: 'Aceros del Sur' });
    await request(app.getHttpServer()).post('/suppliers').send(payload);

    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ legalName: 'Aceros del Sur' }));

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      field: 'legalName',
      value: 'Aceros del Sur',
    });
  });
});
