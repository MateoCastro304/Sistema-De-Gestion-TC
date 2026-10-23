import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../shared/harness/test-app';
import { expectData } from '../../shared/contract/envelopes';
import { createAuthor, createPriceChange, createProcessType } from '../../shared/factories/process-type.factory';

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

describe('Process types (consulta)', () => {
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

  describe('GET /process-types', () => {
    it('lista ordenada por nombre, sin distinguir mayúsculas ni acentos, con la forma del contrato', async () => {
      await createProcessType('Soldadura');
      await createProcessType('Mecanizado Torno CNC');
      await createProcessType('Árbol de levas');

      const res = await request(app.getHttpServer()).get('/process-types');

      const body = expectData(res, 200);
      expect(Object.keys(body).sort()).toEqual(['items', 'limit', 'page', 'total']);
      expect(body).toMatchObject({ total: 3, page: 1, limit: 20 });
      expect(body.items.map((i: { name: string }) => i.name)).toEqual([
        'Árbol de levas',
        'Mecanizado Torno CNC',
        'Soldadura',
      ]);
      expect(Object.keys(body.items[0]).sort()).toEqual(RESOURCE_KEYS);
    });

    it('pagina y informa el total del conjunto completo', async () => {
      await createProcessType('Armado');
      await createProcessType('Soldadura');
      await createProcessType('Torneado');

      const res = await request(app.getHttpServer()).get('/process-types?page=2&limit=1');

      const body = expectData(res, 200);
      expect(body).toMatchObject({ total: 3, page: 2, limit: 1 });
      expect(body.items.map((i: { name: string }) => i.name)).toEqual(['Soldadura']);
    });

    it.each(['torno', 'TORNO', 'tórno'])('filtra por nombre con search=%s', async (search) => {
      await createProcessType('Mecanizado Torno CNC');
      await createProcessType('Soldadura');

      const res = await request(app.getHttpServer()).get(`/process-types?search=${encodeURIComponent(search)}`);

      const body = expectData(res, 200);
      expect(body.total).toBe(1);
      expect(body.items.map((i: { name: string }) => i.name)).toEqual(['Mecanizado Torno CNC']);
    });

    it('responde 200 con la lista vacía cuando nada coincide', async () => {
      await createProcessType('Soldadura');

      const res = await request(app.getHttpServer()).get('/process-types?search=fresado');

      expect(expectData(res, 200)).toEqual({ items: [], total: 0, page: 1, limit: 20 });
    });

    it.each([
      ['page=0', 'page'],
      ['limit=0', 'limit'],
      ['limit=101', 'limit'],
      ['orden=asc', 'orden'],
    ])('rechaza la consulta %s con VALIDATION_ERROR sobre el parámetro', async (query, field) => {
      const res = await request(app.getHttpServer()).get(`/process-types?${query}`);

      expect(res.status).toBe(400);
      expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request', code: 'VALIDATION_ERROR' });
      expect(res.body.details.map((d: { field: string }) => d.field)).toEqual([field]);
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

    it('devuelve items vacío para un tipo que nunca cambió de precio', async () => {
      const processType = await createProcessType();

      const res = await request(app.getHttpServer()).get(`/process-types/${processType.id}/history`);

      expect(expectData(res, 200)).toEqual({ items: [] });
    });

    it('responde 404 PROCESS_TYPE_NOT_FOUND si el tipo no existe', async () => {
      const res = await request(app.getHttpServer()).get('/process-types/99/history');

      expect(res.status).toBe(404);
      expect(res.body.code).toBe('PROCESS_TYPE_NOT_FOUND');
    });
  });
});
