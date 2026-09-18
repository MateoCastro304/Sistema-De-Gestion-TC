import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aCategory, createCategory } from '../../../shared/factories/category-factory';

describe('[CU__] Register Category', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().category.deleteMany(); // data cleanup, not the container
  });

  it('TC-01: Category registered successfully', async () => {
    const payload = aCategory();

    const response = await request(app.getHttpServer()).post('/categories').send(payload);

    expect(response.status).toBe(201);

    const stored = await getPrisma().category.findFirst({
      where: { name: payload.name },
    });
    expect(stored).not.toBeNull();

    expect(stored).toMatchObject({
      name: payload.name,
      isActive: true,
    });
  });

  it('TC-02: Category with no assigned name', async () => {
    const before = await getPrisma().category.count();

    const payload = aCategory({ name: '' });

    const response = await request(app.getHttpServer()).post('/categories').send(payload);

    expect(response.status).toBe(400);

    expect(await getPrisma().category.count()).toBe(before);
  });

  it('TC-03: Duplicate category name', async () => {
    const before = await getPrisma().category.count();

    await createCategory({ name: 'Torneria' });

    const payload = aCategory({ name: 'torneria' });

    const response = await request(app.getHttpServer()).post('/categories').send(payload);

    expect(response.status).toBe(422);

    expect(await getPrisma().category.count()).toBe(before);
  });
});
