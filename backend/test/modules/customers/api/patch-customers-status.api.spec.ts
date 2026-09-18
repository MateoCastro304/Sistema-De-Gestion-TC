import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createCustomer } from '../../../shared/factories/customer-factory';

describe('PATCH /customers/:id/(activate|deactivate)', () => {
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

  it('204 Customer deactivated', async () => {
    const customer = await createCustomer({ isActive: true });

    const response = await request(app.getHttpServer()).patch(`/customers/${customer.id}/deactivate`);

    expect(response.status).toBe(204);

    const stored = await getPrisma().customer.findFirst({ where: { factoryId: customer.factoryId, id: customer.id } });
    expect(stored).toMatchObject({ isActive: false });
  });

  it('404 Deactivate: customer not found', async () => {
    const response = await request(app.getHttpServer()).patch(`/customers/1235498654/deactivate`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/customers/1235498654/deactivate',
      message: expect.any(String),
    });
  });

  it('204 Customer activated', async () => {
    const customer = await createCustomer({ isActive: false });

    const response = await request(app.getHttpServer()).patch(`/customers/${customer.id}/activate`);

    expect(response.status).toBe(204);

    const stored = await getPrisma().customer.findFirst({ where: { factoryId: customer.factoryId, id: customer.id } });
    expect(stored).toMatchObject({ isActive: true });
  });

  it('404 Activate: customer not found', async () => {
    const response = await request(app.getHttpServer()).patch(`/customers/1235498654/activate`);

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      path: '/customers/1235498654/activate',
      message: expect.any(String),
    });
  });
});
