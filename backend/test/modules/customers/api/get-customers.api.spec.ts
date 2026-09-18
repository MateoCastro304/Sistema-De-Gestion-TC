import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createCustomer } from '../../../shared/factories/customer-factory';

describe('GET /customers', () => {
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

  it('200 All customers', async () => {
    await createCustomer();
    await createCustomer();
    await createCustomer();

    const response = await request(app.getHttpServer()).get('/customers');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
  });

  it('GET customers/:id 200 customer found', async () => {
    const customer = await createCustomer({ name: 'Juan' });

    const response = await request(app.getHttpServer()).get(`/customers/${customer.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ id: customer.id, name: 'Juan' });
  });

  it('GET customers/:id 404 customer not found', async () => {
    const response = await request(app.getHttpServer()).get(`/customers/1235498654`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/customers/1235498654',
      message: expect.any(String),
    });
  });

  //   it('401 Unauthorized', async () => {

  //   });

  //   it('403 Forbidden: ', async () => {

  //   });
});
