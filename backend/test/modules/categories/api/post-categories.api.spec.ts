import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aCategory } from '../../../shared/factories/category-factory';

describe('POST /categories', () => {
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

  it('201 Category created successfully', async () => {
    const payload = aCategory();
    const response = await request(app.getHttpServer()).post('/categories').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: expect.any(Number), name: payload.name });

    const stored = await getPrisma().category.findUnique({ where: { id: response.body.id } });
    expect(stored).not.toBeNull();
    expect(stored).toMatchObject({ name: payload.name, isActive: true });
  });

  it('400 Invalid Request: name field empty', async () => {
    const response = await request(app.getHttpServer())
      .post('/categories')
      .send(aCategory({ name: '' }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/categories',
      details: [
        {
          field: 'name',
          message: expect.any(String),
        },
      ],
    });
  });

  it('400 Invalid Request: name longer than 80 characters', async () => {
    const response = await request(app.getHttpServer())
      .post('/categories')
      .send(aCategory({ name: 'a'.repeat(81) }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/categories',
      details: [
        {
          field: 'name',
          message: expect.any(String),
        },
      ],
    });
  });

  //   it('401 Unauthorized', async () => {

  //   });

  //   it('403 Forbidden: ', async () => {

  //   });
});
