import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../shared/harness/test-app';
import { expectData, expectError, expectList, expectNoContent } from '../../shared/contract/envelopes';
import { aSupplierBody, createSupplier } from '../../shared/factories/supplier.factory';

describe('Suppliers', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().supplier.deleteMany(); // limpieza de datos, no del contenedor
  });

  describe('POST /suppliers', () => {
    it('registra un proveedor', async () => {
      const body = aSupplierBody({ supplierTypes: ['MATERIAL', 'PROCESS'] });

      const res = await request(app.getHttpServer()).post('/suppliers').send(body);

      const supplier = expectData(res, 201);
      expect(supplier).toMatchObject({
        id: expect.any(Number),
        legalName: body.legalName,
        supplierTypes: expect.arrayContaining(['MATERIAL', 'PROCESS']),
        active: true,
      });

      const saved = await getPrisma().supplier.findUnique({ where: { id: supplier.id } });
      expect(saved).toMatchObject({ legalName: body.legalName, isActive: true });
    });

    it('rechaza un proveedor sin tipos y no guarda nada', async () => {
      const res = await request(app.getHttpServer())
        .post('/suppliers')
        .send(aSupplierBody({ supplierTypes: [] }));

      expectError(res, 400, 'Bad Request', ['supplierTypes']);
      expect(await getPrisma().supplier.count()).toBe(0);
    });

    it('rechaza una razón social ya registrada', async () => {
      const existing = await createSupplier();

      const res = await request(app.getHttpServer())
        .post('/suppliers')
        .send(aSupplierBody({ legalName: existing.legalName }));

      expectError(res, 409, 'Conflict');
      expect(await getPrisma().supplier.count()).toBe(1); // solo el que ya existía
    });
  });

  describe('GET /suppliers', () => {
    it('lista los proveedores y respeta la paginación', async () => {
      await createSupplier();
      await createSupplier();
      await createSupplier();

      const all = expectList(await request(app.getHttpServer()).get('/suppliers'));
      expect(all).toHaveLength(3);
      expect(all[0]).toMatchObject({ id: expect.any(Number), legalName: expect.any(String), active: true });

      const page = expectList(await request(app.getHttpServer()).get('/suppliers?page=2&limit=2'));
      expect(page).toHaveLength(1);
    });
  });

  describe('GET /suppliers/:id', () => {
    it('devuelve el proveedor', async () => {
      const existing = await createSupplier();

      const res = await request(app.getHttpServer()).get(`/suppliers/${existing.id}`);

      expect(expectData(res, 200)).toMatchObject({ id: existing.id, legalName: existing.legalName });
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).get('/suppliers/999999');

      expectError(res, 404, 'Not Found');
    });
  });

  describe('PATCH /suppliers/:id', () => {
    it('actualiza la razón social', async () => {
      const existing = await createSupplier();

      const res = await request(app.getHttpServer())
        .patch(`/suppliers/${existing.id}`)
        .send({ legalName: 'Aceros del Sur S.A.' });

      expect(expectData(res, 200)).toMatchObject({ id: existing.id, legalName: 'Aceros del Sur S.A.' });
      const saved = await getPrisma().supplier.findUnique({ where: { id: existing.id } });
      expect(saved?.legalName).toBe('Aceros del Sur S.A.');
    });

    it('rechaza una razón social que ya tiene otro proveedor', async () => {
      const other = await createSupplier();
      const existing = await createSupplier();

      const res = await request(app.getHttpServer())
        .patch(`/suppliers/${existing.id}`)
        .send({ legalName: other.legalName });

      expectError(res, 409, 'Conflict');
      const saved = await getPrisma().supplier.findUnique({ where: { id: existing.id } });
      expect(saved?.legalName).toBe(existing.legalName);
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).patch('/suppliers/999999').send({ legalName: 'X' });

      expectError(res, 404, 'Not Found');
    });
  });

  describe('DELETE /suppliers/:id', () => {
    it('desactiva el proveedor sin borrar el registro (baja lógica)', async () => {
      const existing = await createSupplier();

      const res = await request(app.getHttpServer()).delete(`/suppliers/${existing.id}`);

      expectNoContent(res);
      const saved = await getPrisma().supplier.findUnique({ where: { id: existing.id } });
      expect(saved).not.toBeNull();
      expect(saved?.isActive).toBe(false);
    });

    it('responde 404 si no existe', async () => {
      const res = await request(app.getHttpServer()).delete('/suppliers/999999');

      expectError(res, 404, 'Not Found');
    });
  });
});
