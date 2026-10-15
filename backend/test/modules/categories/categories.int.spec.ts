import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../shared/harness/test-app';
import { expectData, expectError, expectNoContent } from '../../shared/contract/envelopes';
import { aCategoryBody, createCategory } from '../../shared/factories/category.factory';
import { createFactory } from '../../shared/factories/factory.factory';

describe('Categories', () => {
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

  describe('POST /categories', () => {
    it('registra una categoría', async () => {
      const body = aCategoryBody();

      const res = await request(app.getHttpServer()).post('/categories').send(body);

      const category = expectData(res, 201);
      expect(category).toMatchObject({ id: expect.any(Number), name: body.name });
      expect(category.createdAt).toEqual(expect.any(String));
      expect(category.updatedAt).toEqual(expect.any(String));

      const saved = await getPrisma().category.findUnique({ where: { id: category.id } });
      expect(saved).toMatchObject({ name: body.name });
    });

    it('rechaza un nombre vacío y no guarda nada', async () => {
      const res = await request(app.getHttpServer()).post('/categories').send({ name: '' });

      expectError(res, 400, 'Bad Request', ['name']);
      expect(await getPrisma().category.count()).toBe(0);
    });

    it('rechaza un nombre ya registrado', async () => {
      const existing = await createCategory();

      const res = await request(app.getHttpServer()).post('/categories').send({ name: existing.name });

      expectError(res, 409, 'Conflict');
      expect(await getPrisma().category.count()).toBe(1); // solo la que ya existía
    });
  });

  describe('GET /categories', () => {
    it('lista las categorías con el total y respeta la paginación', async () => {
      await createCategory();
      await createCategory();
      await createCategory();

      const all = await request(app.getHttpServer()).get('/categories');
      expect(all.status).toBe(200);
      expect(all.body.items).toHaveLength(3);
      expect(all.body.total).toBe(3);
      expect(all.body.items[0]).toMatchObject({ id: expect.any(Number), name: expect.any(String) });

      const page = await request(app.getHttpServer()).get('/categories?page=2&limit=2');
      expect(page.status).toBe(200);
      expect(page.body.items).toHaveLength(1);
      expect(page.body.total).toBe(3);
      expect(page.body).toMatchObject({ page: 2, limit: 2 });
    });

    it('sin active lista solo las activas', async () => {
      const active = await createCategory();
      const inactive = await createCategory();
      await getPrisma().category.update({ where: { id: inactive.id }, data: { isActive: false } });

      const res = await request(app.getHttpServer()).get('/categories');

      expect(res.status).toBe(200);
      expect(res.body.items.map((c: { id: number }) => c.id)).toEqual([active.id]);
      expect(res.body.total).toBe(1);
    });

    it('con active=false lista solo las dadas de baja', async () => {
      const active = await createCategory();
      const inactive = await createCategory();
      await getPrisma().category.update({ where: { id: inactive.id }, data: { isActive: false } });

      const res = await request(app.getHttpServer()).get('/categories?active=false');

      expect(res.status).toBe(200);
      expect(res.body.items.map((c: { id: number }) => c.id)).toEqual([inactive.id]);
      expect(res.body.items.map((c: { id: number }) => c.id)).not.toContain(active.id);
      expect(res.body.total).toBe(1);
    });

    it('rechaza un limit por encima del máximo', async () => {
      const res = await request(app.getHttpServer()).get('/categories?limit=1001');

      expectError(res, 400, 'Bad Request');
    });
  });

  describe('GET /categories/:id', () => {
    it('devuelve la categoría', async () => {
      const existing = await createCategory();

      const res = await request(app.getHttpServer()).get(`/categories/${existing.id}`);

      expect(expectData(res, 200)).toMatchObject({ id: existing.id, name: existing.name });
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).get('/categories/999999');

      expectError(res, 404, 'Not Found');
    });
  });

  describe('PATCH /categories/:id', () => {
    it('actualiza el nombre', async () => {
      const existing = await createCategory();
      const { name } = aCategoryBody();

      const res = await request(app.getHttpServer()).patch(`/categories/${existing.id}`).send({ name });

      expect(expectData(res, 200)).toMatchObject({ id: existing.id, name });
      const saved = await getPrisma().category.findUnique({ where: { id: existing.id } });
      expect(saved?.name).toBe(name);
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).patch('/categories/999999').send(aCategoryBody());

      expectError(res, 404, 'Not Found');
    });
  });

  describe('POST /categories/:id/restore', () => {
    it('reactiva un rubro dado de baja', async () => {
      const existing = await createCategory();
      await getPrisma().category.update({ where: { id: existing.id }, data: { isActive: false } });

      const res = await request(app.getHttpServer()).post(`/categories/${existing.id}/restore`);

      expect(expectData(res, 200)).toMatchObject({ id: existing.id, name: existing.name });
      const saved = await getPrisma().category.findUnique({ where: { id: existing.id } });
      expect(saved?.isActive).toBe(true);
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).post('/categories/999999/restore');

      expectError(res, 404, 'Not Found');
    });
  });

  describe('DELETE /categories/:id', () => {
    it('elimina la categoría', async () => {
      const existing = await createCategory();

      const res = await request(app.getHttpServer()).delete(`/categories/${existing.id}`);

      expectNoContent(res);
      expect(await getPrisma().category.findUnique({ where: { id: existing.id } })).toBeNull();
    });

    it('responde 409 si tiene fábricas asociadas y no la elimina', async () => {
      const factory = await createFactory();

      const res = await request(app.getHttpServer()).delete(`/categories/${factory.categoryId}`);

      expectError(res, 409, 'Conflict');
      expect(await getPrisma().category.findUnique({ where: { id: factory.categoryId } })).not.toBeNull();
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).delete('/categories/999999');

      expectError(res, 404, 'Not Found');
    });
  });
});
