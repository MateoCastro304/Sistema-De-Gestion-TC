import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { expectData } from '../../../shared/contract/envelopes';
import {
  aProcessTypeBody,
  createAuthor,
  createPriceChange,
  createProcessType,
} from '../../../shared/factories/process-type.factory';

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

/**
 * Recurso /process-types completo. Lo que ya demuestran los unitarios (mensajes
 * de validación de la entidad, 404 de los casos de uso, pipe del identificador,
 * comparación sin acentos) no se repite acá: solo lo que necesita HTTP y una
 * base real.
 */
describe('Process types', () => {
  let app: INestApplication;

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
  });

  describe('POST /process-types', () => {
    it('registra el tipo de proceso con los precios tal como llegan y sin historial', async () => {
      const body = aProcessTypeBody();

      const res = await request(app.getHttpServer()).post('/process-types').send(body);

      const created = expectData(res, 201);
      expect(Object.keys(created).sort()).toEqual(RESOURCE_KEYS);
      expect(created).toEqual({
        id: expect.any(Number),
        ...body,
        createdAt: expect.any(String),
        updatedAt: created.createdAt,
      });

      const saved = await getPrisma().processType.findUniqueOrThrow({ where: { id: created.id } });
      expect(saved.hourlyRateArs.toString()).toBe('3100');
      expect(saved.hourlyRateUsd.toString()).toBe('2.24');
      expect(saved.exchangeRate.toString()).toBe('1385.5');
      expect(saved.nameKey).toBe('mecanizado torno cnc 5 ejes');
      expect(saved.createdAt).toEqual(saved.updatedAt);
      expect(await getPrisma().processTypePriceHistory.count()).toBe(0);
    });

    it.each(['mecanizado  torno manual', 'Mecanizado Tórno Manual'])(
      'rechaza el nombre duplicado "%s" y no guarda nada',
      async (name) => {
        await createProcessType('Mecanizado Torno Manual');

        const res = await request(app.getHttpServer()).post('/process-types').send(aProcessTypeBody({ name }));

        expect(res.status).toBe(409);
        expect(res.body).toMatchObject({
          statusCode: 409,
          error: 'Conflict',
          code: 'PROCESS_TYPE_NAME_TAKEN',
          path: '/process-types',
        });
        expect(res.body.details).toEqual([{ field: 'name', message: 'Ya existe un tipo de proceso con ese nombre' }]);
        expect(await getPrisma().processType.count()).toBe(1); // solo el que ya existía
      },
    );

    it('informa un error por campo cuando los precios son inválidos y no guarda nada', async () => {
      const res = await request(app.getHttpServer())
        .post('/process-types')
        .send(aProcessTypeBody({ hourlyRateArs: 0, hourlyRateUsd: 1.234 }));

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request', code: 'VALIDATION_ERROR' });
      expect(res.body.details).toEqual([
        { field: 'hourlyRateArs', message: 'El precio hora en pesos tiene que ser un número mayor a 0' },
        { field: 'hourlyRateUsd', message: 'El precio hora en dólares admite como máximo dos decimales' },
      ]);
      expect(await getPrisma().processType.count()).toBe(0);
    });

    it('rechaza un campo que el endpoint no declara', async () => {
      const res = await request(app.getHttpServer())
        .post('/process-types')
        .send(aProcessTypeBody({ isActive: true }));

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details.map((d: { field: string }) => d.field)).toEqual(['isActive']);
      expect(await getPrisma().processType.count()).toBe(0);
    });
  });

  describe('GET /process-types', () => {
    it('lista ordenada por nombre, paginada y con la forma exacta del contrato', async () => {
      await createProcessType('Soldadura');
      await createProcessType('Mecanizado Torno CNC');
      await createProcessType('Árbol de levas');

      const all = expectData(await request(app.getHttpServer()).get('/process-types'), 200);
      expect(Object.keys(all).sort()).toEqual(['items', 'limit', 'page', 'total']);
      expect(all).toMatchObject({ total: 3, page: 1, limit: 20 });
      expect(all.items.map((i: { name: string }) => i.name)).toEqual([
        'Árbol de levas',
        'Mecanizado Torno CNC',
        'Soldadura',
      ]);
      expect(Object.keys(all.items[0]).sort()).toEqual(RESOURCE_KEYS);

      const second = expectData(await request(app.getHttpServer()).get('/process-types?page=2&limit=1'), 200);
      expect(second).toMatchObject({ total: 3, page: 2, limit: 1 });
      expect(second.items.map((i: { name: string }) => i.name)).toEqual(['Mecanizado Torno CNC']);
    });

    it('filtra por nombre sin distinguir mayúsculas ni acentos', async () => {
      await createProcessType('Mecanizado Torno CNC');
      await createProcessType('Soldadura');

      const res = await request(app.getHttpServer()).get(`/process-types?search=${encodeURIComponent('TÓRNO')}`);

      const body = expectData(res, 200);
      expect(body.total).toBe(1);
      expect(body.items.map((i: { name: string }) => i.name)).toEqual(['Mecanizado Torno CNC']);
    });

    it('rechaza una consulta inválida con VALIDATION_ERROR sobre el parámetro', async () => {
      const res = await request(app.getHttpServer()).get('/process-types?limit=101');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request', code: 'VALIDATION_ERROR' });
      expect(res.body.details.map((d: { field: string }) => d.field)).toEqual(['limit']);
    });
  });

  describe('GET /process-types/:processTypeId', () => {
    it('devuelve el tipo de proceso con la forma exacta del contrato', async () => {
      const created = await createProcessType('Mecanizado Torno Manual', {
        description: 'Torneado convencional.',
        updatedAt: new Date('2026-10-01T13:22:00.000Z'),
      });

      const res = await request(app.getHttpServer()).get(`/process-types/${created.id}`);

      const body = expectData(res, 200);
      expect(Object.keys(body).sort()).toEqual(RESOURCE_KEYS);
      expect(body).toEqual({
        id: created.id,
        name: 'Mecanizado Torno Manual',
        description: 'Torneado convencional.',
        hourlyRateArs: 1557,
        hourlyRateUsd: 1.13,
        exchangeRate: 1377.88,
        createdAt: created.createdAt.toISOString(),
        updatedAt: '2026-10-01T13:22:00.000Z',
      });
    });

    it('responde 404 PROCESS_TYPE_NOT_FOUND si no existe', async () => {
      const res = await request(app.getHttpServer()).get('/process-types/99');

      expect(res.status).toBe(404);
      expect(res.body).toMatchObject({
        statusCode: 404,
        error: 'Not Found',
        code: 'PROCESS_TYPE_NOT_FOUND',
        path: '/process-types/99',
      });
      expect(res.body.details).toBeUndefined();
    });

    it('responde 400 INVALID_PATH_PARAMETER si el identificador no es un entero', async () => {
      const res = await request(app.getHttpServer()).get('/process-types/abc');

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request', code: 'INVALID_PATH_PARAMETER' });
      expect(res.body.details).toEqual([{ field: 'processTypeId', message: 'Debe ser un número entero válido.' }]);
    });
  });

  describe('GET /process-types/:processTypeId/history', () => {
    it('lista los cambios del más reciente al más antiguo, con el usuario y sin paginar', async () => {
      const processType = await createProcessType();
      const fpaz = await createAuthor('fpaz', '30111222');
      const lbenitez = await createAuthor('lbenitez', '30111333');
      await createPriceChange(processType.id, fpaz.id, '2026-07-04T14:05:00.000Z', {
        exchangeRate: '1287.50',
        previousValueUsd: '1.10',
        newValueUsd: '1.21',
      });
      await createPriceChange(processType.id, lbenitez.id, '2026-10-01T13:22:00.000Z', {
        exchangeRate: '1377.88',
        previousValueUsd: '1.21',
        newValueUsd: '1.13',
      });

      const res = await request(app.getHttpServer()).get(`/process-types/${processType.id}/history`);

      const body = expectData(res, 200);
      expect(Object.keys(body)).toEqual(['items']);
      expect(body.items).toEqual([
        {
          id: expect.any(Number),
          changedAt: '2026-10-01T13:22:00.000Z',
          changedBy: { id: lbenitez.id, username: 'lbenitez' },
          exchangeRate: 1377.88,
          previousValueUsd: 1.21,
          newValueUsd: 1.13,
        },
        {
          id: expect.any(Number),
          changedAt: '2026-07-04T14:05:00.000Z',
          changedBy: { id: fpaz.id, username: 'fpaz' },
          exchangeRate: 1287.5,
          previousValueUsd: 1.1,
          newValueUsd: 1.21,
        },
      ]);
    });
  });

  describe('PATCH /process-types/:processTypeId', () => {
    const BEFORE = new Date('2026-10-01T13:22:00.000Z');
    let authorId: number;
    let processTypeId: number;

    const patch = (body: object, id: number | string = processTypeId) =>
      request(app.getHttpServer()).patch(`/process-types/${id}`).set('X-User-Id', String(authorId)).send(body);

    const stored = () => getPrisma().processType.findUniqueOrThrow({ where: { id: processTypeId } });

    beforeEach(async () => {
      authorId = (await createAuthor('fpaz', '30111222')).id;
      processTypeId = (
        await createProcessType('Mecanizado Torno Manual', { description: 'Torneado convencional.', updatedAt: BEFORE })
      ).id;
    });

    describe('cambio de precio e historial', () => {
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

      it('ignora el tipo de cambio si ningún precio cambia: no guarda, no registra y no toca updatedAt', async () => {
        const res = await patch({ exchangeRate: 1500 });

        const body = expectData(res, 200);
        expect(body.exchangeRate).toBe(1377.88);
        expect(body.updatedAt).toBe(BEFORE.toISOString());
        expect((await stored()).updatedAt).toEqual(BEFORE);
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
});
