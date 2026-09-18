import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createCategory } from '../../../shared/factories/category-factory';

describe('PATCH /categories/:id', () => {
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

  it('200 Category updated successfully', async () => {
    const category = await createCategory({ name: 'Original Category Name' });

    const response = await request(app.getHttpServer())
      .patch(`/categories/${category.id}`)
      .send({ name: 'Updated Category Name' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: category.id,
      name: 'Updated Category Name',
    });

    const stored = await getPrisma().category.findUnique({ where: { id: category.id } });
    expect(stored).toMatchObject({ name: 'Updated Category Name' });
  });

  it('404 Category not found', async () => {
    const nonExistentId = 999999;

    const response = await request(app.getHttpServer())
      .patch(`/categories/${nonExistentId}`)
      .send({ name: 'Updated Category Name' });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: `/categories/${nonExistentId}`,
      message: expect.any(String),
    });
  });

  it('400 Invalid Request: name field empty', async () => {
    const category = await createCategory({ name: 'Original Category Name' });

    const response = await request(app.getHttpServer()).patch(`/categories/${category.id}`).send({ name: '' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: `/categories/${category.id}`,
      details: [
        {
          field: 'name',
          message: expect.any(String),
        },
      ],
    });
  });
});
