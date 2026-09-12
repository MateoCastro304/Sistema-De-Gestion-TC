import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aSupplier } from '../../../shared/factories/supplier-factory';

describe('GET /suppliers', () => {
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

  it('201 Supplier created successfully', async () => {
    const response = await request(app.getHttpServer()).post('/suppliers').send(aSupplier());
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: expect.any(String), legalName: expect.any(String), type: 'MATERIAL' });
  });

  it('400 Invalid Request: name field empty', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ legalName: undefined }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/suppliers',
      details: [
        {
          field: 'name',
          message: 'Name cannot be empty.',
        },
      ],
    });
  });

  it('400 Invalid Request: type field empty', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ type: undefined }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/suppliers',
      details: [
        {
          field: 'type',
          message: 'type cannot be empty.',
        },
      ],
    });
  });

  it('400 Invalid Request: invalid type', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ type: 'procc' }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/suppliers',
      details: [
        {
          field: 'type',
          message: 'invalid type',
        },
      ],
    });
  });

  it('400 Invalid Request: invalid taxId format', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ taxId: '3046033121-2' }));
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/suppliers',
      details: [
        {
          field: 'taxId',
          message: 'Invalid taxId format',
        },
      ],
    });
  });

  it('400 Invalid Request: not is a taxId', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ taxId: 'e-stonoesuncu-it' }));
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/suppliers',
      details: [
        {
          field: 'taxId',
          message: 'Not is a taxId',
        },
      ],
    });
  });

  it('400 Invalid Request: invalid mail', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ contactEmail: 'not.valid@' }));
    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/suppliers',
      details: [
        {
          field: 'mail',
          message: 'Invalid mail',
        },
      ],
    });
  });

  //   it('401 Unauthorized', async () => {

  //   });

  //   it('403 Forbidden: ', async () => {

  //   });
});
