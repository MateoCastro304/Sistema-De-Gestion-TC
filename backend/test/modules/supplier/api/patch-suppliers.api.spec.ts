import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aValidCuit, createSupplier } from '../../../shared/factories/supplier-factory';

describe('PATCH /suppliers/:id', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await getPrisma().supplier.deleteMany(); // limpieza de datos, no del container
  });

  it('200 Supplier updated successfully', async () => {
    const supplier = await createSupplier({ legalName: 'Original Supplier Name' });

    const response = await request(app.getHttpServer())
      .patch(`/suppliers/${supplier.id}`)
      .send({ address: 'Nueva direccion 123' });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: supplier.id,
      address: 'Nueva direccion 123',
      legalName: 'Original Supplier Name',
    });
  });

  it('200 clears an optional field when null is sent', async () => {
    const supplier = await createSupplier({ legalName: 'Con contacto', contactName: 'Diego' });

    const response = await request(app.getHttpServer()).patch(`/suppliers/${supplier.id}`).send({ contactName: null });

    expect(response.status).toBe(200);
    // Los opcionales vacios se omiten del cuerpo, no viajan como null.
    expect(response.body).not.toHaveProperty('contactName');
  });

  it('200 sets the observation', async () => {
    const supplier = await createSupplier({ legalName: 'Sin observacion' });

    const response = await request(app.getHttpServer())
      .patch(`/suppliers/${supplier.id}`)
      .send({ observation: 'Entrega los martes' });

    expect(response.status).toBe(200);
    expect(response.body.observation).toBe('Entrega los martes');
  });

  it('404 Supplier not found', async () => {
    const response = await request(app.getHttpServer())
      .patch('/suppliers/999999')
      .send({ address: 'Nueva direccion 123' });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ statusCode: 404, error: 'Not Found', id: 999999 });
  });

  it('404 for an inactive supplier', async () => {
    const supplier = await createSupplier({ legalName: 'Dado de baja', isActive: false });

    const response = await request(app.getHttpServer())
      .patch(`/suppliers/${supplier.id}`)
      .send({ address: 'Nueva direccion 123' });

    expect(response.status).toBe(404);
  });

  it('400 supplierType cannot be updated', async () => {
    const supplier = await createSupplier({ legalName: 'Original Supplier Name' });

    const response = await request(app.getHttpServer())
      .patch(`/suppliers/${supplier.id}`)
      .send({ supplierType: 'PAINT' });

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('supplierType');
  });

  it('400 active is not accepted: there is no reactivation', async () => {
    const supplier = await createSupplier({ legalName: 'Original Supplier Name' });

    const response = await request(app.getHttpServer()).patch(`/suppliers/${supplier.id}`).send({ active: true });

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('active');
  });

  it('400 field does not exist', async () => {
    const supplier = await createSupplier({ legalName: 'Original Supplier Name' });

    const response = await request(app.getHttpServer())
      .patch(`/suppliers/${supplier.id}`)
      .send({ nonExistentField: 'foo' });

    expect(response.status).toBe(400);
    expect(response.body.message.join(' ')).toContain('nonExistentField');
  });

  it('409 taking the legalName of another active supplier', async () => {
    await createSupplier({ legalName: 'Otro Proveedor' });
    const supplier = await createSupplier({ legalName: 'Aceros del Sur' });

    const response = await request(app.getHttpServer())
      .patch(`/suppliers/${supplier.id}`)
      .send({ legalName: 'OTRO PROVEEDOR' });

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ statusCode: 409, field: 'legalName' });
  });

  it('200 taking the cuit of an inactive supplier is allowed', async () => {
    const cuit = aValidCuit();
    await createSupplier({ legalName: 'Dado de baja', cuit: cuit.replace(/-/g, ''), isActive: false });
    const supplier = await createSupplier({ legalName: 'Aceros del Sur' });

    const response = await request(app.getHttpServer()).patch(`/suppliers/${supplier.id}`).send({ cuit });

    expect(response.status).toBe(200);
    expect(response.body.cuit).toBe(cuit);
  });
});
