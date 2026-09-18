import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aFactory } from '../../../shared/factories/factory-factory';
import { createCategory } from '../../../shared/factories/category-factory';

describe('POST /fabricas', () => {
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

  it('201 Factory created successfully', async () => {
    const category = await createCategory();
    const payload = aFactory({ categoryId: category.id });

    const response = await request(app.getHttpServer()).post('/fabricas').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      id: expect.any(Number),
      name: payload.name,
      cuit: payload.cuit,
      address: payload.address,
    });

    const stored = await getPrisma().factory.findUnique({ where: { id: response.body.id } });
    expect(stored).not.toBeNull();
    expect(stored).toMatchObject({
      name: payload.name,
      cuit: payload.cuit,
      address: payload.address,
      categoryId: category.id,
      isActive: true,
    });
  });

  it('400 Invalid Request: name field empty', async () => {
    const category = await createCategory();

    const response = await request(app.getHttpServer())
      .post('/fabricas')
      .send(aFactory({ categoryId: category.id, name: '' }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/fabricas',
      details: [
        {
          field: 'name',
          message: expect.any(String),
        },
      ],
    });
  });

  it('400 Invalid Request: cuit field empty', async () => {
    const category = await createCategory();

    const response = await request(app.getHttpServer())
      .post('/fabricas')
      .send(aFactory({ categoryId: category.id, cuit: '' }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/fabricas',
      details: [
        {
          field: 'cuit',
          message: expect.any(String),
        },
      ],
    });
  });

  it('400 Invalid Request: category does not exist or is inactive', async () => {
    const response = await request(app.getHttpServer())
      .post('/fabricas')
      .send(aFactory({ categoryId: 1235498654 }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/fabricas',
      message: expect.any(String),
    });
  });

  //   it('401 Unauthorized', async () => {

  //   });

  //   it('403 Forbidden: ', async () => {

  //   });
});
