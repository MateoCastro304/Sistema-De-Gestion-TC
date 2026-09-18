import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aFactory, createFactory } from '../../../shared/factories/factory-factory';
import { createCategory } from '../../../shared/factories/category-factory';

describe('[CU58] Register Factory', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().factory.deleteMany(); // data cleanup, not the container
    await getPrisma().category.deleteMany();
  });

  it('TC-01: Factory registered successfully', async () => {
    const category = await createCategory();
    const payload = aFactory({ categoryId: category.id });

    const response = await request(app.getHttpServer()).post('/fabricas').send(payload);

    expect(response.status).toBe(201);

    const stored = await getPrisma().factory.findFirst({
      where: { name: payload.name },
    });
    expect(stored).not.toBeNull();

    expect(stored).toMatchObject({
      name: payload.name,
      cuit: payload.cuit,
      address: payload.address,
      categoryId: category.id,
    });
  });

  it('TC-02: Factory with no assigned category', async () => {
    const before = await getPrisma().factory.count();

    const payload = aFactory({ categoryId: 1235498654 });

    const response = await request(app.getHttpServer()).post('/fabricas').send(payload);

    expect(response.status).toBe(400);

    expect(await getPrisma().factory.count()).toBe(before);
  });

  it('TC-03: Duplicate factory cuit', async () => {
    const before = await getPrisma().factory.count();

    await createFactory({ cuit: '30-70987654-3' });

    const payload = aFactory({ cuit: '30-70987654-3' });

    const response = await request(app.getHttpServer()).post('/fabricas').send(payload);

    expect(response.status).toBe(422);

    expect(await getPrisma().factory.count()).toBe(before);
  });
});
