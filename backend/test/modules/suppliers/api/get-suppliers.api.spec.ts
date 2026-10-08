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
  it('All Suppliers', async () => {
    await createSupplier();
    await createSupplier();
    await createSupplier();
    await createSupplier();

    const response = await request(app.getHttpServer()).get('/suppliers');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(4);
  });

  it('200 Filter By Type', async () => {
    await createSupplier({ type: SupplierType.PAINT });
    await createSupplier({ type: SupplierType.PAINT });
    await createSupplier({ type: SupplierType.MATERIAL });
    await createSupplier({ type: SupplierType.PROCESS });

    const response = await request(app.getHttpServer()).get('/suppliers?type=PAINT');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((c: any) => c.type === 'PAINT')).toBe(true);
  });

  it('400 Filter By Type', async () => {
    const response = await request(app.getHttpServer()).get('/suppliers?type=PAI');
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/suppliers',
      error: expect.any(String),
    });
  });

  it('200 Filter By name', async () => {
    const nameFilter = 'co';
    await createSupplier({ legalName: 'OxyCam' });
    await createSupplier({ legalName: 'Edasa' });
    await createSupplier({ legalName: 'Coca Cola Andina SA' });
    await createSupplier({ legalName: 'CorBlock' });

    const response = await request(app.getHttpServer()).get(`/suppliers?name=${nameFilter}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((c: any) => c.name.toLowerCase().includes(nameFilter))).toBe(true);
  });

  it('GET suppliers/:id 200 supplier found', async () => {
    const supplier = await createSupplier({ legalName: 'CorBlock' });

    const response = await request(app.getHttpServer()).get(`/suppliers/${supplier.id}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].name).toEqual('CorBlock');
  });

  it('GET suppliers/:id 404 supplier not found', async () => {
    const response = await request(app.getHttpServer()).get(`/suppliers/1235498654`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/suppliers',
      error: expect.any(String),
    });
  });
  //   it('401 Unauthorized', async () => {

  //   });

  //   it('403 Forbidden: ', async () => {

  //   });
});
