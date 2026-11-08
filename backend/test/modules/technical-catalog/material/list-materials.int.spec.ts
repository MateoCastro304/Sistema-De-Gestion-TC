import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { expectError } from '../../../shared/contract/envelopes';
import {
  TEST_MATERIAL_PREFIX as PREFIX,
  createMaterial,
  deleteTestMaterials,
} from '../../../shared/factories/material.factory';
import { Api, signInAs } from '../../../shared/harness/auth';
import { startTestApp, stopTestApp } from '../../../shared/harness/test-app';

const ROLES_WITHOUT_ACCESS = ['JT', 'ERP', 'ER', 'AS'] as const;

const ACERO = `${PREFIX} Acero`;
const BRONCE = `${PREFIX} Bronce`;

const labels = (res: { body: { items: { name: string; quality: string }[] } }) =>
  res.body.items.map((material) => `${material.name} ${material.quality}`);

/** CU-39: AT o EC (`material:manage`) consultan el catálogo. */
describe('GET /materials', () => {
  let app: INestApplication;
  let at: Api;
  let ec: Api;
  const withoutAccess = new Map<string, Api>();

  beforeAll(async () => {
    app = await startTestApp();
    at = await signInAs(app, 'AT');
    ec = await signInAs(app, 'EC');
    for (const role of ROLES_WITHOUT_ACCESS) withoutAccess.set(role, await signInAs(app, role));
  });

  afterAll(async () => {
    await deleteTestMaterials();
    await stopTestApp();
  });

  beforeEach(async () => {
    await deleteTestMaterials();
    await createMaterial(ACERO, '1045');
    await createMaterial(ACERO, '1010');
    await createMaterial(`${PREFIX} Acero inoxidable`, 'AISI 304');
    for (const quality of ['SAE 65', 'SAE 10', 'SAE 62', 'SAE 9']) await createMaterial(BRONCE, quality);
  });

  it('200: the envelope and the resource of the contract', async () => {
    const res = await at.get(`/materials?name=${encodeURIComponent(ACERO)}&limit=1`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      items: [{ id: expect.any(Number), name: ACERO, quality: '1010', createdAt: expect.any(String) }],
      total: 2,
      page: 1,
      limit: 1,
    });
  });

  it('200: the Encargado de Cotización can consult it too', async () => {
    expect((await ec.get(`/materials?name=${encodeURIComponent(ACERO)}`)).status).toBe(200);
  });

  it('orders by name and, within each name, by quality with natural number order (escenario 2)', async () => {
    const res = await at.get(`/materials?name=${encodeURIComponent(BRONCE)}`);

    expect(labels(res)).toEqual([`${BRONCE} SAE 9`, `${BRONCE} SAE 10`, `${BRONCE} SAE 62`, `${BRONCE} SAE 65`]);
  });

  it('puts "Acero" before "Acero inoxidable", and both before "Bronce", when there is no filter', async () => {
    const res = await at.get('/materials?limit=100');

    expect(labels(res).filter((label) => label.startsWith(PREFIX))).toEqual([
      `${ACERO} 1010`,
      `${ACERO} 1045`,
      `${PREFIX} Acero inoxidable AISI 304`,
      `${BRONCE} SAE 9`,
      `${BRONCE} SAE 10`,
      `${BRONCE} SAE 62`,
      `${BRONCE} SAE 65`,
    ]);
  });

  describe('filters', () => {
    it('name is an exact match, ignoring case and accents, so it does not mix "Acero inoxidable"', async () => {
      const res = await at.get(`/materials?name=${encodeURIComponent(ACERO.toUpperCase())}`);

      expect(labels(res)).toEqual([`${ACERO} 1010`, `${ACERO} 1045`]);
      expect(res.body.total).toBe(2);
    });

    it('quality contains the text, and the two filters combine (escenario 1)', async () => {
      const res = await at.get(`/materials?name=${encodeURIComponent(ACERO)}&quality=10`);

      expect(labels(res)).toEqual([`${ACERO} 1010`, `${ACERO} 1045`]);
      expect(labels(await at.get(`/materials?name=${encodeURIComponent(ACERO)}&quality=104`))).toEqual([
        `${ACERO} 1045`,
      ]);
    });

    it('quality ignores case and accents', async () => {
      const res = await at.get(`/materials?name=${encodeURIComponent(BRONCE)}&quality=${encodeURIComponent('sáe 6')}`);

      expect(labels(res)).toEqual([`${BRONCE} SAE 62`, `${BRONCE} SAE 65`]);
    });
  });

  it('paginates, and the total is the one of the filtered set', async () => {
    const res = await at.get(`/materials?name=${encodeURIComponent(BRONCE)}&page=2&limit=3`);

    expect(labels(res)).toEqual([`${BRONCE} SAE 65`]);
    expect(res.body).toMatchObject({ total: 4, page: 2, limit: 3 });
  });

  it('200 with an empty list and total 0 when nothing matches, not an error (escenario 3)', async () => {
    const res = await at.get('/materials?name=Inexistente');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: [], total: 0, page: 1, limit: 20 });
  });

  describe('invalid query (escenario 6)', () => {
    it.each([
      ['page=0', 'page=0', 'page'],
      ['limit=0', 'limit=0', 'limit'],
      ['limit=101', 'limit=101', 'limit'],
      ['a name of more than 60 characters', `name=${'a'.repeat(61)}`, 'name'],
      ['a quality of more than 60 characters', `quality=${'a'.repeat(61)}`, 'quality'],
      ['a parameter that does not exist', 'color=rojo', 'color'],
    ])('400 VALIDATION_ERROR for %s', async (_label, query, field) => {
      const res = await at.get(`/materials?${query}`);

      expectError(res, 400, 'Bad Request', [field]);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('authentication and authorization (escenario 5)', () => {
    it('401 without a session', async () => {
      expectError(await request(app.getHttpServer()).get('/materials'), 401, 'Unauthorized');
    });

    it.each(ROLES_WITHOUT_ACCESS)('403 FORBIDDEN for the role %s', async (role) => {
      const res = await (withoutAccess.get(role) as Api).get('/materials');

      expectError(res, 403, 'Forbidden');
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
