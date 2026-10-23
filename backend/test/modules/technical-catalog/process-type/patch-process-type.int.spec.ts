import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { expectData } from '../../../shared/contract/envelopes';
import { createAuthor, createProcessType } from '../../../shared/factories/process-type.factory';

const RESOURCE_KEYS = [
  'createdAt',
  'description',
  'exchangeRate',
  'hourlyRateArs',
  'hourlyRateUsd',
  'id',
  'name',
  'updatedAt',
];
const BEFORE = new Date('2026-10-01T13:22:00.000Z');

describe('PATCH /process-types/:processTypeId', () => {
  let app: INestApplication;
  let authorId: number;
  let processTypeId: number;

  const patch = (body: object, id: number | string = processTypeId) =>
    request(app.getHttpServer()).patch(`/process-types/${id}`).set('X-User-Id', String(authorId)).send(body);

  const stored = () => getPrisma().processType.findUniqueOrThrow({ where: { id: processTypeId } });

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().processTypePriceHistory.deleteMany(); // hijas primero
    await getPrisma().processType.deleteMany();
    await getPrisma().user.deleteMany();
    await getPrisma().employee.deleteMany();
    authorId = (await createAuthor('fpaz', '30111222')).id;
    processTypeId = (
      await createProcessType('Mecanizado Torno Manual', { description: 'Torneado convencional.', updatedAt: BEFORE })
    ).id;
  });

  describe('cambio de precio', () => {
    it('guarda dólares y tipo de cambio manteniendo los pesos, y registra el historial', async () => {
      const res = await patch({ hourlyRateUsd: 1.12, exchangeRate: 1390 });

      const body = expectData(res, 200);
      expect(Object.keys(body).sort()).toEqual(RESOURCE_KEYS);
      expect(body).toMatchObject({ id: processTypeId, hourlyRateArs: 1557, hourlyRateUsd: 1.12, exchangeRate: 1390 });
      expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(BEFORE.getTime());

      const row = await stored();
      expect(row.hourlyRateArs.toString()).toBe('1557');
      expect(row.hourlyRateUsd.toString()).toBe('1.12');
      expect(row.exchangeRate.toString()).toBe('1390');

      const history = await request(app.getHttpServer()).get(`/process-types/${processTypeId}/history`);
      expect(expectData(history, 200).items).toEqual([
        {
          id: expect.any(Number),
          changedAt: body.updatedAt,
          changedBy: { id: authorId, username: 'fpaz' },
          exchangeRate: 1390,
          previousValueUsd: 1.13,
          newValueUsd: 1.12,
        },
      ]);
    });

    it('registra un solo cambio aunque cambien los dos precios', async () => {
      const res = await patch({ hourlyRateArs: 1700, hourlyRateUsd: 1.22, exchangeRate: 1393.44 });

      expect(res.status).toBe(200);
      expect(await getPrisma().processTypePriceHistory.count()).toBe(1);
    });

    it('ignora el tipo de cambio si ningún precio cambia: nada se guarda ni se registra', async () => {
      const res = await patch({ exchangeRate: 1500 });

      const body = expectData(res, 200);
      expect(body.exchangeRate).toBe(1377.88);
      expect(body.updatedAt).toBe(BEFORE.toISOString());
      expect(await getPrisma().processTypePriceHistory.count()).toBe(0);
    });
  });

  describe('cambio de nombre o descripción', () => {
    it.each([
      ['name', { name: 'Torno Manual' }, { name: 'Torno Manual' }],
      ['description', { description: '' }, { description: null }],
    ])('actualiza %s y updatedAt, sin registrar historial', async (_field, change, expected) => {
      const res = await patch(change);

      const body = expectData(res, 200);
      expect(body).toMatchObject(expected);
      expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(BEFORE.getTime());
      expect(await getPrisma().processTypePriceHistory.count()).toBe(0);
    });
  });

  describe('sin cambios', () => {
    it('responde 200 con el tipo tal como estaba, sin tocar updatedAt ni el historial', async () => {
      const res = await patch({ name: 'Mecanizado Torno Manual', hourlyRateUsd: 1.13, exchangeRate: 1377.88 });

      const body = expectData(res, 200);
      expect(body.updatedAt).toBe(BEFORE.toISOString());
      expect((await stored()).updatedAt).toEqual(BEFORE);
      expect(await getPrisma().processTypePriceHistory.count()).toBe(0);
    });

    it('rechaza un cuerpo vacío con el mensaje del contrato', async () => {
      const res = await patch({});

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        code: 'VALIDATION_ERROR',
        message: 'Enviá al menos un campo para modificar.',
      });
    });
  });

  describe('rechazos que no modifican nada', () => {
    it('responde 409 si el nombre ya es de otro tipo de proceso', async () => {
      await createProcessType('Soldadura');

      const res = await patch({ name: 'soldadura' });

      expect(res.status).toBe(409);
      expect(res.body).toMatchObject({ statusCode: 409, error: 'Conflict', code: 'PROCESS_TYPE_NAME_TAKEN' });
      expect(res.body.details).toEqual([{ field: 'name', message: 'Ya existe un tipo de proceso con ese nombre' }]);
      expect((await stored()).name).toBe('Mecanizado Torno Manual');
    });

    it('responde 400 si llega un precio sin tipo de cambio', async () => {
      const res = await patch({ hourlyRateUsd: 1.12 });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toEqual([
        { field: 'exchangeRate', message: 'Ingresá un tipo de cambio mayor a 0, con hasta dos decimales' },
      ]);
      expect((await stored()).hourlyRateUsd.toString()).toBe('1.13');
    });

    it('responde 404 PROCESS_TYPE_NOT_FOUND si el tipo de proceso no existe', async () => {
      const res = await patch({ name: 'Otro' }, 99999);

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({ statusCode: 404, code: 'PROCESS_TYPE_NOT_FOUND' });
    });

    it('responde 400 INVALID_PATH_PARAMETER si el identificador no es un entero', async () => {
      const res = await patch({ name: 'Otro' }, 'abc');

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_PATH_PARAMETER');
    });
  });

  describe('autor del cambio (provisorio hasta tener sesión)', () => {
    it('responde 401 UNAUTHENTICATED sin el header X-User-Id y no modifica nada', async () => {
      const res = await request(app.getHttpServer()).patch(`/process-types/${processTypeId}`).send({ name: 'Otro' });

      expect(res.status).toBe(401);
      expect(res.body).toMatchObject({ statusCode: 401, error: 'Unauthorized', code: 'UNAUTHENTICATED' });
      expect((await stored()).name).toBe('Mecanizado Torno Manual');
    });

    it('revierte el cambio de precio si el autor no existe: ni el tipo ni el historial cambian', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/process-types/${processTypeId}`)
        .set('X-User-Id', '999999')
        .send({ hourlyRateUsd: 1.12, exchangeRate: 1390 });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHENTICATED');
      const row = await stored();
      expect(row.hourlyRateUsd.toString()).toBe('1.13');
      expect(row.exchangeRate.toString()).toBe('1377.88');
      expect(row.updatedAt).toEqual(BEFORE);
      expect(await getPrisma().processTypePriceHistory.count()).toBe(0);
    });
  });
});
