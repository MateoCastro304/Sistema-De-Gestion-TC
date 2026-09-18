import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aCustomer } from '../../../shared/factories/customer-factory';
import { createFactory } from '../../../shared/factories/factory-factory';

describe('POST /customers', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().customer.deleteMany(); // data cleanup, not the container
    await getPrisma().factory.deleteMany();
    await getPrisma().category.deleteMany();
  });

  it('201 Customer created successfully', async () => {
    const factory = await createFactory();
    const payload = aCustomer({ factoryId: factory.id });

    const response = await request(app.getHttpServer()).post('/customers').send(payload);

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: payload.name,
      lastName: payload.lastName,
      mail: payload.mail.toLowerCase(),
    });

    const stored = await getPrisma().customer.findFirst({ where: { factoryId: factory.id } });
    expect(stored).not.toBeNull();
    expect(stored).toMatchObject({
      name: payload.name,
      lastName: payload.lastName,
      phone: payload.phone,
      mail: payload.mail.toLowerCase(),
      factoryId: factory.id,
    });
  });

  it('400 Invalid Request: name field empty', async () => {
    const factory = await createFactory();

    const response = await request(app.getHttpServer())
      .post('/customers')
      .send(aCustomer({ factoryId: factory.id, name: '' }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/customers',
    });
  });

  it('400 Invalid Request: invalid mail', async () => {
    const factory = await createFactory();

    const response = await request(app.getHttpServer())
      .post('/customers')
      .send(aCustomer({ factoryId: factory.id, mail: 'not.valid@' }));

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: '/customers',
    });
  });

  it('404 Invalid Request: factory does not exist', async () => {
    const response = await request(app.getHttpServer())
      .post('/customers')
      .send(aCustomer({ factoryId: 1235498654 }));

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/customers',
      message: expect.any(String),
    });
  });

  //   it('401 Unauthorized', async () => {

  //   });

  //   it('403 Forbidden: ', async () => {

  //   });
});
