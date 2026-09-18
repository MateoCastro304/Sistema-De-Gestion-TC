import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createCategory } from '../../../shared/factories/category-factory';

describe('GET /categories', () => {
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

  it('200 All categories', async () => {
    await createCategory();
    await createCategory();
    await createCategory();

    const response = await request(app.getHttpServer()).get('/categories');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
  });

  it('200 Paginated list respects page and limit', async () => {
    await createCategory();
    await createCategory();
    await createCategory();

    const response = await request(app.getHttpServer()).get('/categories?page=1&limit=2');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('GET categories/:id 200 category found', async () => {
    const category = await createCategory({ name: 'Torneria' });

    const response = await request(app.getHttpServer()).get(`/categories/${category.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: category.id, name: 'Torneria' });
  });

  it('GET categories/:id 404 category not found', async () => {
    const response = await request(app.getHttpServer()).get(`/categories/1235498654`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/categories/1235498654',
      message: expect.any(String),
    });
  });

  //   it('401 Unauthorized', async () => {

  //   });

  //   it('403 Forbidden: ', async () => {

  //   });
});
