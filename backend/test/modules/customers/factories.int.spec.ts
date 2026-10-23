import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../shared/harness/test-app';
import { expectData, expectError, expectNoContent } from '../../shared/contract/envelopes';
import { createCategory } from '../../shared/factories/category.factory';
import { aFactoryBody, createFactory } from '../../shared/factories/factory.factory';

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
        id: expect.any(String),
        legalName: body.legalName,
        cuit: body.cuit.replace(/-/g, ''),
        categoryId: String(category.id),
      });

      const saved = await getPrisma().factory.findUnique({ where: { id: Number(factory.id) } });
      expect(saved).toMatchObject({ name: body.legalName, categoryId: category.id });
    });

    it('rechaza un cuit con formato inválido y no guarda nada', async () => {
      const category = await createCategory();

      const res = await request(app.getHttpServer())
        .post('/factories')
        .send(aFactoryBody({ categoryId: category.id, cuit: '123' }));

      expectError(res, 400, 'Bad Request', ['cuit']);
      expect(await getPrisma().factory.count()).toBe(0);
    });

    it('rechaza un cuit ya registrado', async () => {
      const existing = await createFactory();
      const category = await createCategory();
      const d = existing.cuit;

      const res = await request(app.getHttpServer())
        .post('/factories')
        .send(aFactoryBody({ categoryId: category.id, cuit: `${d.slice(0, 2)}-${d.slice(2, 10)}-${d.slice(10)}` }));

      expectError(res, 409, 'Conflict');
      expect(await getPrisma().factory.count()).toBe(1); // solo la que ya existía
    });
  });

  describe('GET /factories', () => {
    it('lista las fábricas, con el total', async () => {
      await createFactory();
      await createFactory();

      const res = await request(app.getHttpServer()).get('/factories');

      expect(res.status).toBe(200);
      expect(res.body.items).toHaveLength(2);
      expect(res.body.total).toBe(2);
      expect(res.body.items[0]).toMatchObject({
        id: expect.any(String),
        legalName: expect.any(String),
        cuit: expect.any(String),
        categoryId: expect.any(String),
      });
    });
  });

  describe('GET /factories/:id', () => {
    it('devuelve la fábrica', async () => {
      const existing = await createFactory();

      const res = await request(app.getHttpServer()).get(`/factories/${existing.id}`);

      expect(expectData(res, 200)).toMatchObject({ id: String(existing.id), legalName: existing.name });
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

      expect(expectData(res, 200)).toMatchObject({ id: String(existing.id), legalName: 'Nuevo Nombre S.A.' });
      const saved = await getPrisma().factory.findUnique({ where: { id: existing.id } });
      expect(saved?.name).toBe('Nuevo Nombre S.A.');
    });

    it('rechaza modificar el cuit (inmutable) y no cambia nada', async () => {
      const existing = await createFactory();

      const res = await request(app.getHttpServer()).patch(`/factories/${existing.id}`).send({ cuit: '30-11111111-1' });

      expectError(res, 400, 'Bad Request');
      const saved = await getPrisma().factory.findUnique({ where: { id: existing.id } });
      expect(saved?.cuit).toBe(existing.cuit);
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).patch('/factories/999999').send({ legalName: 'X' });

      expectError(res, 404, 'Not Found');
    });
  });

  describe('PATCH /factories/:id/deactivate', () => {
    it('da de baja lógica la fábrica (el registro se conserva)', async () => {
      const existing = await createFactory();

      const res = await request(app.getHttpServer()).patch(`/factories/${existing.id}/deactivate`);

      expectNoContent(res);
      const saved = await getPrisma().factory.findUnique({ where: { id: existing.id } });
      expect(saved).not.toBeNull(); // baja lógica: el registro se conserva
      expect(saved?.isActive).toBe(false);
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).patch('/factories/999999/deactivate');

      expectError(res, 404, 'Not Found');
    });
  });
});
