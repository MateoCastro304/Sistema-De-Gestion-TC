import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { SuppliersModule } from '../../../../src/suppliers/suppliers.module';
import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';

describe('POST /suppliers', () => {
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

  it('Supplier created successfully', async () => {
    const response = await request(app.getHttpServer()).post('/suppliers').send({
      legalName: 'Aceros del Sur S.A.',
      taxId: '30-70987654-3',
      contactName: 'Diego Fernandez',
      contactEmail: 'sales@acerosdelsur.com',
      contactPhone: '+54 9 351 444-5678',
      address: 'Av. Circunvalacion 4500, Cordoba',
    });
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({ id: expect.any(String), legalName: expect.any(String) });
  });
});
