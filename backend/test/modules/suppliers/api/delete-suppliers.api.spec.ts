import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createSupplier } from '../../../shared/factories/supplier-factory';

describe('DELETE /suppliers/:id', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().supplier.deleteMany(); // limpieza de datos, no del container
  });

  it('200 Supplier deleted', async () => {
    const supplier = await createSupplier({ legalName: 'CorBlock' });

    const response = await request(app.getHttpServer()).delete(`/suppliers/${supplier.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
  });

  it('404 supplier not found', async () => {
    const response = await request(app.getHttpServer()).get(`/suppliers/1235498654`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/suppliers',
      error: expect.any(String),
    });
  });

  //   it('401 Unauthorized', async () => {

  //   });

  //   it('403 Forbidden: ', async () => {

  //   });
});
