import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createCustomer } from '../../../shared/factories/customer-factory';

describe('PATCH /customers/:id', () => {
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

  it('200 Customer updated successfully', async () => {
    const customer = await createCustomer({ phone: '+54 9 351 000-0000' });

    const response = await request(app.getHttpServer())
      .patch(`/customers/${customer.id}`)
      .send({ phone: '+54 9 351 111-1111' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: customer.id,
      phone: '+54 9 351 111-1111',
    });

    const stored = await getPrisma().customer.findFirst({ where: { factoryId: customer.factoryId, id: customer.id } });
    expect(stored).toMatchObject({ phone: '+54 9 351 111-1111' });
  });

  it('404 Customer not found', async () => {
    const nonExistentId = 999999;

    const response = await request(app.getHttpServer())
      .patch(`/customers/${nonExistentId}`)
      .send({ phone: '+54 9 351 111-1111' });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: `/customers/${nonExistentId}`,
      message: expect.any(String),
    });
  });

  it('400 Invalid Request: invalid mail', async () => {
    const customer = await createCustomer();

    const response = await request(app.getHttpServer())
      .patch(`/customers/${customer.id}`)
      .send({ mail: 'not.valid@' });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      statusCode: 400,
      path: `/customers/${customer.id}`,
    });
  });
});
