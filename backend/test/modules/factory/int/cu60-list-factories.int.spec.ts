import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createFactory } from '../../../shared/factories/factory-factory';

describe('[CU60] List Factories', () => {
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

  it('TC-01: General list', async () => {
    await createFactory();
    await createFactory();
    await createFactory();

    const response = await request(app.getHttpServer()).get('/fabricas');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
  });

  it('TC-02: Inactive factories are not listed', async () => {
    await createFactory({ isActive: false });
    await createFactory();

    const response = await request(app.getHttpServer()).get('/fabricas');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
  });

  it('TC-03: There are no active factories', async () => {
    const response = await request(app.getHttpServer()).get('/fabricas');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });
});
