import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createFactory } from '../../../shared/factories/factory-factory';

describe('GET /fabricas', () => {
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

  it('200 All factories', async () => {
    await createFactory();
    await createFactory();
    await createFactory();

    const response = await request(app.getHttpServer()).get('/fabricas');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
  });

  it('GET fabricas/:id 200 factory found', async () => {
    const factory = await createFactory({ name: 'CorBlock SA' });

    const response = await request(app.getHttpServer()).get(`/fabricas/${factory.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: factory.id, name: 'CorBlock SA' });
  });

  it('GET fabricas/:id 404 factory not found', async () => {
    const response = await request(app.getHttpServer()).get(`/fabricas/1235498654`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/fabricas/1235498654',
      message: expect.any(String),
    });
  });

  //   it('401 Unauthorized', async () => {

  //   });

  //   it('403 Forbidden: ', async () => {

  //   });
});
