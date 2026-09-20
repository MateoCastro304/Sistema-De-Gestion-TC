import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createSupplier } from '../../../shared/factories/supplier-factory';

describe('PATCH /suppliers/:id', () => {
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

  it('200 Supplier updated successfully', async () => {
    const supplier = await createSupplier({ legalName: 'Original Supplier Name', type: 'MATERIAL' });

    const response = await request(app.getHttpServer())
      .patch(`/suppliers/${supplier.id}`)
      .send({ address: 'Nueva dirección 123' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: supplier.id,
      address: 'Nueva dirección 123',
    });
  });

  it('404 Supplier not found', async () => {
    const nonExistentId = 999999;

    const response = await request(app.getHttpServer())
      .patch(`/suppliers/${nonExistentId}`)
      .send({ address: 'Nueva dirección 123' });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: `/suppliers/${nonExistentId}`,
      error: expect.any(String),
    });
  });

  it('400 Invalid Request: type cannot be updated', async () => {
    const supplier = await createSupplier({ legalName: 'Original Supplier Name', type: 'MATERIAL' });

    const response = await request(app.getHttpServer()).patch(`/suppliers/${supplier.id}`).send({ type: 'PAINT' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: `/suppliers/${supplier.id}`,
      details: [
        {
          field: 'type',
          message: expect.any(String),
        },
      ],
    });
  });

  it('400 Invalid Request: field does not exist', async () => {
    const supplier = await createSupplier({ legalName: 'Original Supplier Name', type: 'MATERIAL' });

    const response = await request(app.getHttpServer())
      .patch(`/suppliers/${supplier.id}`)
      .send({ nonExistentField: 'foo' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: `/suppliers/${supplier.id}`,
      details: [
        {
          field: 'nonExistentField',
          message: expect.any(String),
        },
      ],
    });
  });
});
