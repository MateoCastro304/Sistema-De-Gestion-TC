import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../shared/harness/test-app';
import { expectData, expectError, expectList } from '../../shared/contract/envelopes';
import { createFactory } from '../../shared/factories/factory.factory';
import { aCustomerBody, createCustomer } from '../../shared/factories/customer.factory';

// Contract: docs/openapi/customers.yaml (CU-01..04).
describe('Customers', () => {
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

  describe('POST /factories/:factoryId/customers', () => {
    it('registra un encargado en la fábrica', async () => {
      const factory = await createFactory();
      const body = aCustomerBody();

      const res = await request(app.getHttpServer()).post(`/factories/${factory.id}/customers`).send(body);

      const customer = expectData(res, 201);
      expect(customer).toMatchObject({
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
        .post(`/factories/${factory.id}/customers`)
        .send(aCustomerBody({ mail: 'no-es-un-mail' }));

      expectError(res, 400, 'Bad Request', ['mail']);
      expect(await getPrisma().customer.count()).toBe(0);
    });

    it('rechaza un encargado sin mail ni teléfono y no guarda nada', async () => {
      const factory = await createFactory();

      const res = await request(app.getHttpServer())
        .post(`/factories/${factory.id}/customers`)
        .send(aCustomerBody({ mail: null, phone: null }));

      expectError(res, 400, 'Bad Request');
      expect(await getPrisma().customer.count()).toBe(0);
    });

    it('rechaza un mail ya registrado en la misma fábrica', async () => {
      const existing = await createCustomer();

      const res = await request(app.getHttpServer())
        .post(`/factories/${existing.factoryId}/customers`)
        .send(aCustomerBody({ mail: existing.mail! }));

      expectError(res, 409, 'Conflict');
      expect(await getPrisma().customer.count()).toBe(1); // solo el que ya existía
    });

    it('responde 409 si la fábrica no existe y no guarda nada', async () => {
      const res = await request(app.getHttpServer()).post('/factories/999999/customers').send(aCustomerBody());

      expectError(res, 409, 'Conflict');
      expect(await getPrisma().customer.count()).toBe(0);
    });
  });

  describe('GET /customers', () => {
    it('lista los encargados de todas las fábricas', async () => {
      await createCustomer();
      await createCustomer();

      const customers = expectList(await request(app.getHttpServer()).get('/customers'));

      expect(customers).toHaveLength(2);
      expect(customers[0]).toMatchObject({
        id: expect.any(String),
        factoryId: expect.any(String),
        firstName: expect.any(String),
        isActive: true,
      });
    });
  });

  describe('GET /factories/:factoryId/customers/:id', () => {
    it('devuelve el encargado', async () => {
      const existing = await createCustomer();

      const res = await request(app.getHttpServer()).get(`/factories/${existing.factoryId}/customers/${existing.id}`);

      expect(expectData(res, 200)).toMatchObject({
        id: String(existing.id),
        factoryId: String(existing.factoryId),
        firstName: existing.name,
      });
    });

    it('responde 404 si no existe', async () => {
      const factory = await createFactory();

      const res = await request(app.getHttpServer()).get(`/factories/${factory.id}/customers/999999`);

      expectError(res, 404, 'Not Found');
    });
  });

  describe('PATCH /factories/:factoryId/customers/:id', () => {
    it('actualiza el nombre del encargado', async () => {
      const existing = await createCustomer();

      const res = await request(app.getHttpServer())
        .patch(`/factories/${existing.factoryId}/customers/${existing.id}`)
        .send({ firstName: 'Marcela' });

      expect(expectData(res, 200)).toMatchObject({ id: String(existing.id), firstName: 'Marcela' });
      const saved = await getPrisma().customer.findUnique({
        where: { factoryId_id: { factoryId: existing.factoryId, id: existing.id } },
      });
      expect(saved?.name).toBe('Marcela');
    });

    it('rechaza un mail que ya tiene otro encargado de la fábrica', async () => {
      const other = await createCustomer();
      const existing = await createCustomer({ factoryId: other.factoryId });

      const res = await request(app.getHttpServer())
        .patch(`/factories/${existing.factoryId}/customers/${existing.id}`)
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
        .patch(`/factories/${factory.id}/customers/999999`)
        .send({ firstName: 'X' });

      expectError(res, 404, 'Not Found');
    });
  });

  describe('PATCH /factories/:factoryId/customers/:id/deactivate', () => {
    it('da de baja lógica al encargado y devuelve el encargado', async () => {
      const existing = await createCustomer();

      const res = await request(app.getHttpServer()).patch(
        `/factories/${existing.factoryId}/customers/${existing.id}/deactivate`,
      );

      expect(expectData(res, 200)).toMatchObject({ id: String(existing.id), isActive: false });
      const saved = await getPrisma().customer.findUnique({
        where: { factoryId_id: { factoryId: existing.factoryId, id: existing.id } },
      });
      expect(saved).not.toBeNull(); // baja lógica: el registro se conserva
      expect(saved?.isActive).toBe(false);
    });

    it('responde 404 si no existe', async () => {
      const factory = await createFactory();

      const res = await request(app.getHttpServer()).patch(`/factories/${factory.id}/customers/999999/deactivate`);

      expectError(res, 404, 'Not Found');
    });
  });
});
