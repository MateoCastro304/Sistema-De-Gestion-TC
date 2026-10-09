import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../shared/harness/test-app';
import { expectData, expectError, expectList, expectNoContent } from '../../shared/contract/envelopes';
import { createCategory } from '../../shared/factories/category.factory';
import { aFactoryBody, createFactory } from '../../shared/factories/factory.factory';
import { createManager } from '../../shared/factories/manager.factory';

describe('Factories', () => {
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

  describe('POST /factories', () => {
    it('registra una fábrica', async () => {
      const category = await createCategory();
      const body = aFactoryBody({ categoryId: category.id });

      const res = await request(app.getHttpServer()).post('/factories').send(body);

      const factory = expectData(res, 201);
      expect(factory).toMatchObject({
        id: expect.any(Number),
        legalName: body.legalName,
        taxId: body.taxId,
        categoryId: category.id,
      });

      const saved = await getPrisma().factory.findUnique({ where: { id: factory.id } });
      expect(saved).toMatchObject({ name: body.legalName, categoryId: category.id });
    });

    it('rechaza un taxId con formato inválido y no guarda nada', async () => {
      const category = await createCategory();

      const res = await request(app.getHttpServer())
        .post('/factories')
        .send(aFactoryBody({ categoryId: category.id, taxId: '123' }));

      expectError(res, 400, 'Bad Request', ['taxId']);
      expect(await getPrisma().factory.count()).toBe(0);
    });

    it('rechaza un taxId ya registrado', async () => {
      const existing = await createFactory();
      const category = await createCategory();
      const d = existing.cuit;

      const res = await request(app.getHttpServer())
        .post('/factories')
        .send(aFactoryBody({ categoryId: category.id, taxId: `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}` }));

      expectError(res, 409, 'Conflict');
      expect(await getPrisma().factory.count()).toBe(1); // solo la que ya existía
    });
  });

  describe('GET /factories', () => {
    it('lista las fábricas', async () => {
      await createFactory();
      await createFactory();

      const factories = expectList(await request(app.getHttpServer()).get('/factories'));

      expect(factories).toHaveLength(2);
      expect(factories[0]).toMatchObject({
        id: expect.any(Number),
        legalName: expect.any(String),
        taxId: expect.any(String),
        categoryId: expect.any(Number),
      });
    });
  });

  describe('GET /factories/:id', () => {
    it('devuelve la fábrica', async () => {
      const existing = await createFactory();

      const res = await request(app.getHttpServer()).get(`/factories/${existing.id}`);

      expect(expectData(res, 200)).toMatchObject({ id: existing.id, legalName: existing.name });
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).get('/factories/999999');

      expectError(res, 404, 'Not Found');
    });
  });

  describe('PATCH /factories/:id', () => {
    it('actualiza la razón social', async () => {
      const existing = await createFactory();

      const res = await request(app.getHttpServer())
        .patch(`/factories/${existing.id}`)
        .send({ legalName: 'Nuevo Nombre S.A.' });

      expect(expectData(res, 200)).toMatchObject({ id: existing.id, legalName: 'Nuevo Nombre S.A.' });
      const saved = await getPrisma().factory.findUnique({ where: { id: existing.id } });
      expect(saved?.name).toBe('Nuevo Nombre S.A.');
    });

    it('rechaza modificar el taxId (inmutable) y no cambia nada', async () => {
      const existing = await createFactory();

      const res = await request(app.getHttpServer())
        .patch(`/factories/${existing.id}`)
        .send({ taxId: '30-11111111-1' });

      expectError(res, 400, 'Bad Request');
      const saved = await getPrisma().factory.findUnique({ where: { id: existing.id } });
      expect(saved?.cuit).toBe(existing.cuit);
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).patch('/factories/999999').send({ legalName: 'X' });

      expectError(res, 404, 'Not Found');
    });
  });

  describe('DELETE /factories/:id', () => {
    it('elimina la fábrica junto con sus encargados', async () => {
      const manager = await createManager();

      const res = await request(app.getHttpServer()).delete(`/factories/${manager.factoryId}`);

      expectNoContent(res);
      expect(await getPrisma().factory.findUnique({ where: { id: manager.factoryId } })).toBeNull();
      expect(await getPrisma().customer.count()).toBe(0); // cascada del contrato
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).delete('/factories/999999');

      expectError(res, 404, 'Not Found');
    });
  });
});
