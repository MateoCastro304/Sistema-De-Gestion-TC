import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createSupplier } from '../../../shared/factories/supplier-factory';
import { SupplierType } from '../../../../src/generated/prisma/enums';

describe('GET /suppliers', () => {
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

  it('200 returns the page inside an envelope with the total', async () => {
    await createSupplier();
    await createSupplier();
    await createSupplier();
    await createSupplier();

    const response = await request(app.getHttpServer()).get('/suppliers');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ total: 4, page: 1, limit: 20 });
    expect(response.body.items).toHaveLength(4);
  });

  it('200 filter by type', async () => {
    await createSupplier({ supplierType: SupplierType.PAINT });
    await createSupplier({ supplierType: SupplierType.PAINT });
    await createSupplier({ supplierType: SupplierType.MATERIAL });
    await createSupplier({ supplierType: SupplierType.PROCESS });

    const response = await request(app.getHttpServer()).get('/suppliers?type=PAINT');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.items.every((s: { supplierType: string }) => s.supplierType === 'PAINT')).toBe(true);
  });

  it('400 filter by an unknown type', async () => {
    const response = await request(app.getHttpServer()).get('/suppliers?type=PAI');

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('type');
  });

  it('200 search by legal name', async () => {
    await createSupplier({ legalName: 'OxyCam' });
    await createSupplier({ legalName: 'Edasa' });
    await createSupplier({ legalName: 'Coca Cola Andina SA' });
    await createSupplier({ legalName: 'CorBlock' });

    const response = await request(app.getHttpServer()).get('/suppliers?search=co');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
  });

  it('200 a blank search is ignored instead of matching nothing', async () => {
    await createSupplier();
    await createSupplier();

    const response = await request(app.getHttpServer()).get('/suppliers?search=%20%20');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
  });

  it('400 limit over the cap', async () => {
    const response = await request(app.getHttpServer()).get('/suppliers?limit=1000');

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('limit');
  });

  it('400 page below 1', async () => {
    const response = await request(app.getHttpServer()).get('/suppliers?page=0');

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('page');
  });
});

describe('GET /suppliers/:id', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().supplier.deleteMany();
  });

  it('200 supplier found, returned flat and not wrapped', async () => {
    const supplier = await createSupplier({ legalName: 'CorBlock' });

    const response = await request(app.getHttpServer()).get(`/suppliers/${supplier.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: supplier.id,
      legalName: 'CorBlock',
      active: true,
    });
  });

  it('404 supplier not found', async () => {
    const response = await request(app.getHttpServer()).get('/suppliers/1235498654');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      id: 1235498654,
    });
  });

  it('404 for an inactive supplier, never active:false', async () => {
    const supplier = await createSupplier({ legalName: 'Dado de baja', isActive: false });

    const response = await request(app.getHttpServer()).get(`/suppliers/${supplier.id}`);

    expect(response.status).toBe(404);
  });

  it('400 non-numeric id', async () => {
    const response = await request(app.getHttpServer()).get('/suppliers/abc');

    expect(response.status).toBe(400);
  });
});
