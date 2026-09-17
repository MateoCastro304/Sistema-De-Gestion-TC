import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aSupplier, createSupplier } from '../../../shared/factories/supplier-factory';

describe('[CU33] Register Supplier', () => {
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

  it('TC-01: Supplier registered successfully', async () => {
    const payload = aSupplier();

    const response = await request(app.getHttpServer()).post('/suppliers').send(payload);

    expect(response.status).toBe(201);

    const stored = await getPrisma().supplier.findFirst({
      where: { name: payload.legalName },
    });
    expect(stored).not.toBeNull();

    expect(stored).toMatchObject({
      name: payload.legalName,
      type: payload.type,
      address: payload.address,
    });
  });

  it('TC-02: Supplier with no assigned type', async () => {
    const before = await getPrisma().supplier.count();

    const payload = aSupplier({ type: undefined });

    const response = await request(app.getHttpServer()).post('/suppliers').send(payload);

    expect(response.status).toBe(400);

    expect(await getPrisma().supplier.count()).toBe(before);
  });

  it('TC-03: Duplicate supplier legal name', async () => {
    const before = await getPrisma().supplier.count();

    await createSupplier({ legalName: 'CorBlock' });

    const payload = aSupplier({ legalName: 'corblock' });

    const response = await request(app.getHttpServer()).post('/suppliers').send(payload);

    expect(response.status).toBe(422);

    expect(await getPrisma().supplier.count()).toBe(before);
  });
});
