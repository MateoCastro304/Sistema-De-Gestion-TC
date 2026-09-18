import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aCustomer } from '../../../shared/factories/customer-factory';
import { createFactory } from '../../../shared/factories/factory-factory';

describe('[CU01] Register Customer', () => {
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

  it('TC-01: Customer registered successfully', async () => {
    const factory = await createFactory();
    const payload = aCustomer({ factoryId: factory.id });

    const response = await request(app.getHttpServer()).post('/customers').send(payload);

    expect(response.status).toBe(201);

    const stored = await getPrisma().customer.findFirst({
      where: { factoryId: factory.id, mail: payload.mail.toLowerCase() },
    });
    expect(stored).not.toBeNull();

    expect(stored).toMatchObject({
      name: payload.name,
      lastName: payload.lastName,
      phone: payload.phone,
      factoryId: factory.id,
    });
  });

  it('TC-02: Customer with no assigned factory', async () => {
    const before = await getPrisma().customer.count();

    const payload = aCustomer({ factoryId: 1235498654 });

    const response = await request(app.getHttpServer()).post('/customers').send(payload);

    expect(response.status).toBe(404);

    expect(await getPrisma().customer.count()).toBe(before);
  });

  it('TC-03: Invalid mail format', async () => {
    const factory = await createFactory();
    const before = await getPrisma().customer.count();

    const payload = aCustomer({ factoryId: factory.id, mail: 'not-an-email' });

    const response = await request(app.getHttpServer()).post('/customers').send(payload);

    expect(response.status).toBe(400);

    expect(await getPrisma().customer.count()).toBe(before);
  });
});
