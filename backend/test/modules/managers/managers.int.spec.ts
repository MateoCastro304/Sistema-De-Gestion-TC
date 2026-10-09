import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../shared/harness/test-app';
import { expectData, expectError, expectList, expectNoContent } from '../../shared/contract/envelopes';
import { createFactory } from '../../shared/factories/factory.factory';
import { aManagerBody, createManager } from '../../shared/factories/manager.factory';

describe('Managers', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().customer.deleteMany(); // hijas primero
    await getPrisma().factory.deleteMany();
    await getPrisma().category.deleteMany(); // limpieza de datos, no del contenedor
  });

  describe('POST /factories/:factoryId/managers', () => {
    it('registra un encargado en la fábrica', async () => {
      const factory = await createFactory();
      const body = aManagerBody();

      const res = await request(app.getHttpServer()).post(`/factories/${factory.id}/managers`).send(body);

      const manager = expectData(res, 201);
      expect(manager).toMatchObject({ id: expect.any(Number), name: body.name, email: body.email });

      const saved = await getPrisma().customer.findMany({ where: { factoryId: factory.id } });
      expect(saved).toHaveLength(1);
      expect(saved[0].name).toBe(body.name);
    });

    it('rechaza un encargado sin nombre y no guarda nada', async () => {
      const factory = await createFactory();

      const res = await request(app.getHttpServer())
        .post(`/factories/${factory.id}/managers`)
        .send(aManagerBody({ name: '' }));

      expectError(res, 400, 'Bad Request', ['name']);
      expect(await getPrisma().customer.count()).toBe(0);
    });

    it('responde 404 si la fábrica no existe', async () => {
      const res = await request(app.getHttpServer()).post('/factories/999999/managers').send(aManagerBody());

      expectError(res, 404, 'Not Found');
      expect(await getPrisma().customer.count()).toBe(0);
    });
  });

  describe('GET /factories/:factoryId/managers', () => {
    it('lista solo los encargados de esa fábrica', async () => {
      const factory = await createFactory();
      await createManager({ factoryId: factory.id });
      await createManager({ factoryId: factory.id });
      await createManager(); // de otra fábrica

      const managers = expectList(await request(app.getHttpServer()).get(`/factories/${factory.id}/managers`));

      expect(managers).toHaveLength(2);
    });
  });

  describe('GET /factories/:factoryId/managers/:id', () => {
    it('responde 404 si el encargado no existe', async () => {
      const factory = await createFactory();

      const res = await request(app.getHttpServer()).get(`/factories/${factory.id}/managers/999999`);

      expectError(res, 404, 'Not Found');
    });
  });

  describe('PATCH /factories/:factoryId/managers/:id', () => {
    it('actualiza el nombre del encargado', async () => {
      const existing = await createManager();

      const res = await request(app.getHttpServer())
        .patch(`/factories/${existing.factoryId}/managers/${existing.id}`)
        .send({ name: 'Marcela Rios' });

      expect(expectData(res, 200)).toMatchObject({ id: existing.id, name: 'Marcela Rios' });
      const saved = await getPrisma().customer.findUnique({
        where: { factoryId_id: { factoryId: existing.factoryId, id: existing.id } },
      });
      expect(saved?.name).toBe('Marcela Rios');
    });
  });

  describe('DELETE /factories/:factoryId/managers/:id', () => {
    it('elimina al encargado', async () => {
      const existing = await createManager();

      const res = await request(app.getHttpServer()).delete(`/factories/${existing.factoryId}/managers/${existing.id}`);

      expectNoContent(res);
      expect(await getPrisma().customer.count()).toBe(0);
    });
  });
});
