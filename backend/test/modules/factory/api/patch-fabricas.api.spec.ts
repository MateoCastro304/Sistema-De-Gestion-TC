import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createFactory } from '../../../shared/factories/factory-factory';

describe('PATCH /fabricas/:id', () => {
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

  it('200 Factory updated successfully', async () => {
    const factory = await createFactory({ name: 'Original Factory Name' });

    const response = await request(app.getHttpServer())
      .patch(`/fabricas/${factory.id}`)
      .send({ address: 'Nueva direccion 123' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: factory.id,
      address: 'Nueva direccion 123',
    });

    const stored = await getPrisma().factory.findUnique({ where: { id: factory.id } });
    expect(stored).toMatchObject({ address: 'Nueva direccion 123' });
  });

  it('404 Factory not found', async () => {
    const nonExistentId = 999999;

    const response = await request(app.getHttpServer())
      .patch(`/fabricas/${nonExistentId}`)
      .send({ address: 'Nueva direccion 123' });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: `/fabricas/${nonExistentId}`,
      message: expect.any(String),
    });
  });

  it('400 Invalid Request: category does not exist or is inactive', async () => {
    const factory = await createFactory();

    const response = await request(app.getHttpServer())
      .patch(`/fabricas/${factory.id}`)
      .send({ categoryId: 1235498654 });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: `/fabricas/${factory.id}`,
      message: expect.any(String),
    });
  });
});
