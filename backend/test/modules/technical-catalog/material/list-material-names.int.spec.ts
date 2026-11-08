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

/** CU-37 y CU-39: AT o EC (`material:manage`) piden los nombres de material para el filtro y el combo del alta. */
describe('GET /materials/names', () => {
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
    await createMaterial(`${PREFIX} Teflón`, 'Virgen');
    await createMaterial(`${PREFIX} Acero`, '1045');
    await createMaterial(`${PREFIX} Acero`, '1010');
    await createMaterial(`${PREFIX} Acero inoxidable`, 'AISI 304');
    await createMaterial(`${PREFIX} Bronce`, 'SAE 65');
  });

  const testNames = (names: string[]) => names.filter((name) => name.startsWith(PREFIX));

  it('200: the distinct names in alphabetical order, without pagination (escenario 6)', async () => {
    const res = await at.get('/materials/names');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ items: expect.any(Array) });
    expect(testNames(res.body.items)).toEqual([
      `${PREFIX} Acero`,
      `${PREFIX} Acero inoxidable`,
      `${PREFIX} Bronce`,
      `${PREFIX} Teflón`,
    ]);
  });

  it('the Encargado de Cotización can consult it too', async () => {
    expect((await ec.get('/materials/names')).status).toBe(200);
  });

  it('does not repeat a name that has several qualities', async () => {
    const res = await at.get('/materials/names');

    expect(testNames(res.body.items).filter((name) => name === `${PREFIX} Acero`)).toHaveLength(1);
  });

  describe('authentication and authorization', () => {
    it('401 without a session', async () => {
      expectError(await request(app.getHttpServer()).get('/materials/names'), 401, 'Unauthorized');
    });

    it.each(ROLES_WITHOUT_ACCESS)('403 FORBIDDEN for the role %s', async (role) => {
      const res = await (withoutAccess.get(role) as Api).get('/materials/names');

      expectError(res, 403, 'Forbidden');
      expect(res.body.code).toBe('FORBIDDEN');
    });
  });
});
