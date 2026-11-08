import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { expectError } from '../../../shared/contract/envelopes';
import {
  TEST_MATERIAL_PREFIX as PREFIX,
  aMaterialBody,
  countMaterials,
  createMaterial,
  deleteTestMaterials,
} from '../../../shared/factories/material.factory';
import { Api, signInAs } from '../../../shared/harness/auth';
import { getPrisma, startTestApp, stopTestApp } from '../../../shared/harness/test-app';

const ROLES_WITHOUT_ACCESS = ['JT', 'ERP', 'ER', 'AS'] as const;

/** CU-37: AT o EC (`material:manage`) registran materiales. */
describe('POST /materials', () => {
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

  beforeEach(deleteTestMaterials);

  describe('registers the material', () => {
    it('201: with the fields of the contract, saved with its author (escenario 1)', async () => {
      const res = await at.post('/materials').send(aMaterialBody());

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: expect.any(Number),
        name: `${PREFIX} Acero`,
        quality: '4140',
        createdAt: expect.any(String),
      });
      expect(Number.isNaN(Date.parse(res.body.createdAt))).toBe(false);

      const stored = await getPrisma().material.findUniqueOrThrow({ where: { id: res.body.id } });
      expect(stored.createdByUserId).toBe(at.userId);
      expect(stored.isActive).toBe(true);
    });

    it('201: the Encargado de Cotización inherits the permission', async () => {
      const res = await ec.post('/materials').send(aMaterialBody());

      expect(res.status).toBe(201);
    });

    it('201: saves name and quality without spaces at the ends', async () => {
      const res = await at.post('/materials').send(aMaterialBody({ name: `  ${PREFIX} Acero  `, quality: ' 4140 ' }));

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ name: `${PREFIX} Acero`, quality: '4140' });
    });

    it('201: the same name can have another quality', async () => {
      await createMaterial(`${PREFIX} Acero`, '1045');

      const res = await at.post('/materials').send(aMaterialBody({ quality: '1010' }));

      expect(res.status).toBe(201);
    });
  });

  describe('name spelling and name list', () => {
    it('201: a name written by hand that already exists keeps the existing spelling (escenario 5)', async () => {
      await createMaterial(`${PREFIX} Acero`, '1045');

      const res = await at
        .post('/materials')
        .send(aMaterialBody({ name: `${PREFIX.toLowerCase()} acero`, quality: '1010' }));

      expect(res.status).toBe(201);
      expect(res.body.name).toBe(`${PREFIX} Acero`);

      const names = await at.get('/materials/names');
      expect(names.body.items.filter((name: string) => name.toLowerCase() === `${PREFIX} acero`.toLowerCase())).toEqual(
        [`${PREFIX} Acero`],
      );
    });

    it('201: a new name appears in GET /materials/names (escenario 4)', async () => {
      const res = await at.post('/materials').send(aMaterialBody({ name: `${PREFIX} Nylon`, quality: 'PA6' }));
      expect(res.status).toBe(201);

      const names = await at.get('/materials/names');

      expect(names.body.items).toContain(`${PREFIX} Nylon`);
    });
  });

  describe('validation', () => {
    it('400: reports the empty fields and registers nothing (escenario 3)', async () => {
      const res = await at.post('/materials').send({ name: '', quality: '   ' });

      expectError(res, 400, 'Bad Request', ['name', 'quality']);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toEqual([
        { field: 'name', message: 'Ingresá el material' },
        { field: 'quality', message: 'Ingresá la calidad' },
      ]);
    });

    it('400: reports the missing fields', async () => {
      const res = await at.post('/materials').send({});

      expectError(res, 400, 'Bad Request', ['name', 'quality']);
    });

    it('400: a field over 60 characters', async () => {
      const res = await at.post('/materials').send(aMaterialBody({ quality: 'a'.repeat(61) }));

      expectError(res, 400, 'Bad Request', ['quality']);
      expect(await getPrisma().material.count({ where: { name: `${PREFIX} Acero` } })).toBe(0);
    });

    it('400: a field the contract does not define', async () => {
      const res = await at.post('/materials').send(aMaterialBody({ price: 10 }));

      expectError(res, 400, 'Bad Request');
    });
  });

  describe('duplicates', () => {
    it('409 MATERIAL_ALREADY_EXISTS on the quality field, ignoring case, accents and spaces (escenario 2)', async () => {
      await createMaterial(`${PREFIX} Acero`, '1045');

      const res = await at
        .post('/materials')
        .send(aMaterialBody({ name: `${PREFIX.toLowerCase()} acéro`, quality: ' 1045 ' }));

      expectError(res, 409, 'Conflict', ['quality']);
      expect(res.body.code).toBe('MATERIAL_ALREADY_EXISTS');
      expect(res.body.message).toBe('Ya existe un material registrado con ese nombre y calidad');
      expect(await countMaterials(`${PREFIX} Acero`, '1045')).toBe(1);
    });

    it('only one of two simultaneous identical registrations wins', async () => {
      const [first, second] = await Promise.all([
        at.post('/materials').send(aMaterialBody({ quality: 'SIM' })),
        ec.post('/materials').send(aMaterialBody({ quality: 'SIM' })),
      ]);

      expect([first.status, second.status].sort()).toEqual([201, 409]);
      expect(await countMaterials(`${PREFIX} Acero`, 'SIM')).toBe(1);
    });
  });

  describe('authentication and authorization', () => {
    it('401 without a session (escenario 7)', async () => {
      expectError(await request(app.getHttpServer()).post('/materials').send(aMaterialBody()), 401, 'Unauthorized');
    });

    it.each(ROLES_WITHOUT_ACCESS)('403 FORBIDDEN for the role %s (escenario 7)', async (role) => {
      const res = await (withoutAccess.get(role) as Api).post('/materials').send(aMaterialBody());

      expectError(res, 403, 'Forbidden');
      expect(res.body.code).toBe('FORBIDDEN');
      expect(res.body.message).toBe('No tenés permisos para realizar esta operación.');
      expect(await countMaterials(`${PREFIX} Acero`, '4140')).toBe(0);
    });
  });
});
