import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createCategory } from '../../../shared/factories/category-factory';

describe('DELETE /categories/:id', () => {
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

  it('200 Category deactivated (logical delete)', async () => {
    const category = await createCategory({ name: 'CorBlock' });

    const response = await request(app.getHttpServer()).delete(`/categories/${category.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: category.id, name: 'CorBlock' });

    const stored = await getPrisma().category.findUnique({ where: { id: category.id } });
    expect(stored).toMatchObject({ isActive: false });
  });

  it('404 Category not found', async () => {
    const response = await request(app.getHttpServer()).delete(`/categories/1235498654`);

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
