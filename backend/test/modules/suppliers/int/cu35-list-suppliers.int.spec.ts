import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createSupplier } from '../../../shared/factories/supplier-factory';
import { SupplierType } from '@prisma/client';

describe('[CU35] List Suppliers', () => {
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

  it('TC-01: General List', async () => {
    await createSupplier();
    await createSupplier();
    await createSupplier();
    await createSupplier();

    const response = await request(app.getHttpServer()).get('/suppliers');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(4);
  });

  it('TC-02: Filter by type', async () => {
    await createSupplier({ type: SupplierType.PAINT });
    await createSupplier({ type: SupplierType.PAINT });
    await createSupplier({ type: SupplierType.MATERIAL });
    await createSupplier({ type: SupplierType.PROCESS });

    const response = await request(app.getHttpServer()).get('/suppliers?type=PAINT');
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data.every((c: any) => c.type === 'PAINT')).toBe(true);
  });

  it('TC-03: Find by name', async () => {
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

  it('TC-04: There are no active suppliers', async () => {
    await getPrisma().supplier.deleteMany();

    const response = await request(app.getHttpServer()).get(`/suppliers`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(0);
  });

  //   it('401 Unauthorized', async () => {

  //   });

  //   it('403 Forbidden: ', async () => {

  //   });
});
