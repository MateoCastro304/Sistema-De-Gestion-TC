import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createCustomer } from '../../../shared/factories/customer-factory';
import { createFactory } from '../../../shared/factories/factory-factory';

describe('[CU03] List Customers', () => {
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

  it('TC-01: General list', async () => {
    await createCustomer();
    await createCustomer();
    await createCustomer();

    const response = await request(app.getHttpServer()).get('/customers');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
  });

  it('TC-02: Customers from the same factory are all listed', async () => {
    const factory = await createFactory();
    await createCustomer({ factoryId: factory.id });
    await createCustomer({ factoryId: factory.id });

    const response = await request(app.getHttpServer()).get('/customers');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
    expect(response.body.every((c: any) => c.factoryId === factory.id)).toBe(true);
  });

  it('TC-03: There are no registered customers', async () => {
    const response = await request(app.getHttpServer()).get('/customers');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });
});
