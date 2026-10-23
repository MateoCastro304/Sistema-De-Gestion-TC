import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { expectData } from '../../../shared/contract/envelopes';
import { aProcessTypeBody, createProcessType } from '../../../shared/factories/process-type.factory';

describe('Process types', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().processTypePriceHistory.deleteMany(); // hija primero
    await getPrisma().processType.deleteMany();
  });

  describe('POST /process-types', () => {
    it('registra el tipo de proceso con los precios tal como llegan y sin historial', async () => {
      const body = aProcessTypeBody();

      const res = await request(app.getHttpServer()).post('/process-types').send(body);

      const created = expectData(res, 201);
      expect(Object.keys(created).sort()).toEqual(
        [
          'createdAt',
          'description',
          'exchangeRate',
          'hourlyRateArs',
          'hourlyRateUsd',
          'id',
          'name',
          'updatedAt',
        ].sort(),
      );
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

    it('informa cada campo obligatorio que falta', async () => {
      const res = await request(app.getHttpServer()).post('/process-types').send({});

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toEqual([
        { field: 'name', message: 'Ingresá el nombre del tipo de proceso' },
        { field: 'hourlyRateArs', message: 'Ingresá el precio hora en pesos' },
        { field: 'hourlyRateUsd', message: 'Ingresá el precio hora en dólares' },
        { field: 'exchangeRate', message: 'Ingresá un tipo de cambio mayor a 0, con hasta dos decimales' },
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
});
