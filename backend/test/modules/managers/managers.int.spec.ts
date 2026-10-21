import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../shared/harness/test-app';
import { expectData, expectError, expectNoContent } from '../../shared/contract/envelopes';
import { createFactory } from '../../shared/factories/factory.factory';
import { aManagerBody, createManager } from '../../shared/factories/manager.factory';

// Contrato: docs/openapi/paths/factories@{factoryId}@managers*.yaml (CU-01..04).
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
      expect(manager).toMatchObject({
        id: expect.any(String),
        factoryId: String(factory.id),
        firstName: body.firstName,
        lastName: body.lastName,
        mail: body.mail,
        isActive: true,
      });

      const saved = await getPrisma().customer.findMany({ where: { factoryId: factory.id } });
      expect(saved).toHaveLength(1);
      expect(saved[0]).toMatchObject({ name: body.firstName, mail: body.mail, isActive: true });
    });

    it('rechaza un mail con formato inválido y no guarda nada', async () => {
      const factory = await createFactory();

      const res = await request(app.getHttpServer())
        .post(`/factories/${factory.id}/managers`)
        .send(aManagerBody({ mail: 'no-es-un-mail' }));

      expectError(res, 400, 'Bad Request', ['mail']);
      expect(await getPrisma().customer.count()).toBe(0);
    });

    it('rechaza un encargado sin mail ni teléfono y no guarda nada', async () => {
      const factory = await createFactory();

      const res = await request(app.getHttpServer())
        .post(`/factories/${factory.id}/managers`)
        .send(aManagerBody({ mail: null, phone: null }));

      expectError(res, 400, 'Bad Request');
      expect(await getPrisma().customer.count()).toBe(0);
    });

    it('rechaza un encargado sin nombre y no guarda nada', async () => {
      const factory = await createFactory();

      const res = await request(app.getHttpServer())
        .post(`/factories/${factory.id}/managers`)
        .send(aManagerBody({ firstName: '' }));

      expectError(res, 400, 'Bad Request', ['firstName']);
      expect(await getPrisma().customer.count()).toBe(0);
    });

    it('rechaza un mail ya registrado en la misma fábrica', async () => {
      const existing = await createManager();

      const res = await request(app.getHttpServer())
        .post(`/factories/${existing.factoryId}/managers`)
        .send(aManagerBody({ mail: existing.mail! }));

      expectError(res, 409, 'Conflict');
      expect(await getPrisma().customer.count()).toBe(1); // solo el que ya existía
    });

    it('responde 404 si la fábrica no existe y no guarda nada', async () => {
      const res = await request(app.getHttpServer()).post('/factories/999999/managers').send(aManagerBody());

      expectError(res, 404, 'Not Found');
      expect(await getPrisma().customer.count()).toBe(0);
    });
  });

  describe('GET /managers', () => {
    it('lista los encargados de todas las fábricas, con el total', async () => {
      await createManager();
      await createManager();

      const res = await request(app.getHttpServer()).get('/managers');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.items[0]).toMatchObject({
        id: expect.any(String),
        factoryId: expect.any(String),
        firstName: expect.any(String),
        isActive: true,
      });
    });
  });

  describe('GET /factories/:factoryId/managers/:id', () => {
    it('devuelve el encargado', async () => {
      const existing = await createManager();

      const res = await request(app.getHttpServer()).get(`/factories/${existing.factoryId}/managers/${existing.id}`);

      expect(expectData(res, 200)).toMatchObject({
        id: String(existing.id),
        factoryId: String(existing.factoryId),
        firstName: existing.name,
      });
    });

    it('responde 404 si no existe', async () => {
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
        .send({ firstName: 'Marcela' });

      expect(expectData(res, 200)).toMatchObject({ id: String(existing.id), firstName: 'Marcela' });
      const saved = await getPrisma().customer.findUnique({
        where: { factoryId_id: { factoryId: existing.factoryId, id: existing.id } },
      });
      expect(saved?.name).toBe('Marcela');
    });

    it('rechaza un mail que ya tiene otro encargado de la fábrica', async () => {
      const other = await createManager();
      const existing = await createManager({ factoryId: other.factoryId });

      const res = await request(app.getHttpServer())
        .patch(`/factories/${existing.factoryId}/managers/${existing.id}`)
        .send({ mail: other.mail });

      expectError(res, 409, 'Conflict');
      const saved = await getPrisma().customer.findUnique({
        where: { factoryId_id: { factoryId: existing.factoryId, id: existing.id } },
      });
      expect(saved?.mail).toBe(existing.mail);
    });

    it('responde 404 si no existe', async () => {
      const factory = await createFactory();

      const res = await request(app.getHttpServer())
        .patch(`/factories/${factory.id}/managers/999999`)
        .send({ firstName: 'X' });

      expectError(res, 404, 'Not Found');
    });
  });

  describe('PATCH /factories/:factoryId/managers/:id/deactivate', () => {
    it('da de baja lógica al encargado (204, sin cuerpo)', async () => {
      const existing = await createManager();

      const res = await request(app.getHttpServer()).patch(
        `/factories/${existing.factoryId}/managers/${existing.id}/deactivate`,
      );

      expectNoContent(res);
      const saved = await getPrisma().customer.findUnique({
        where: { factoryId_id: { factoryId: existing.factoryId, id: existing.id } },
      });
      expect(saved).not.toBeNull(); // baja lógica: el registro se conserva
      expect(saved?.isActive).toBe(false);
    });

    it('responde 404 si no existe', async () => {
      const factory = await createFactory();

      const res = await request(app.getHttpServer()).patch(`/factories/${factory.id}/managers/999999/deactivate`);

      expectError(res, 404, 'Not Found');
    });
  });
});
