import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createFactory } from '../../../shared/factories/factory-factory';

describe('PATCH /fabricas/:id/(activate|deactivate)', () => {
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

  it('204 Factory deactivated', async () => {
    const factory = await createFactory({ isActive: true });

    const response = await request(app.getHttpServer()).patch(`/fabricas/${factory.id}/deactivate`);

    expect(response.status).toBe(204);

    const stored = await getPrisma().factory.findUnique({ where: { id: factory.id } });
    expect(stored).toMatchObject({ isActive: false });
  });

  it('404 Deactivate: factory not found', async () => {
    const response = await request(app.getHttpServer()).patch(`/fabricas/1235498654/deactivate`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/fabricas/1235498654/deactivate',
      message: expect.any(String),
    });
  });

  it('204 Factory activated', async () => {
    const factory = await createFactory({ isActive: false });

    const response = await request(app.getHttpServer()).patch(`/fabricas/${factory.id}/activate`);

    expect(response.status).toBe(204);

    const stored = await getPrisma().factory.findUnique({ where: { id: factory.id } });
    expect(stored).toMatchObject({ isActive: true });
  });

  it('404 Activate: factory not found', async () => {
    const response = await request(app.getHttpServer()).patch(`/fabricas/1235498654/activate`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/fabricas/1235498654/activate',
      message: expect.any(String),
    });
  });
});
