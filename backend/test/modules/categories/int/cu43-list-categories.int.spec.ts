import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { createCategory } from '../../../shared/factories/category-factory';

describe('[CU43] List Categories', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().category.deleteMany(); // data cleanup, not the container
  });

  it('TC-01: General list', async () => {
    await createCategory();
    await createCategory();
    await createCategory();

    const response = await request(app.getHttpServer()).get('/categories');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(3);
  });

  it('TC-02: There are no active categories', async () => {
    const response = await request(app.getHttpServer()).get('/categories');
    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(0);
  });
});
