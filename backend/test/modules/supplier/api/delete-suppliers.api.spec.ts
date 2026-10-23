import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aValidCuit, aSupplier, createSupplier } from '../../../shared/factories/supplier-factory';

describe('DELETE /suppliers/:id', () => {
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

  it('204 Supplier deactivated, with no body', async () => {
    const supplier = await createSupplier({ legalName: 'CorBlock' });

    const response = await request(app.getHttpServer()).delete(`/suppliers/${supplier.id}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
  });

  it('the row is kept and only the flag changes', async () => {
    const supplier = await createSupplier({ legalName: 'CorBlock' });

    await request(app.getHttpServer()).delete(`/suppliers/${supplier.id}`);

    // Baja logica: la fila se conserva para que los materiales y las ordenes
    // que la referencian sigan siendo validos.
    const stored = await getPrisma().supplier.findUnique({ where: { id: supplier.id } });
    expect(stored).not.toBeNull();
    expect(stored!.isActive).toBe(false);
  });

  it('after the baja it disappears from the listing', async () => {
    const supplier = await createSupplier({ legalName: 'CorBlock' });
    await createSupplier({ legalName: 'Sigue activo' });

    await request(app.getHttpServer()).delete(`/suppliers/${supplier.id}`);

    const response = await request(app.getHttpServer()).get('/suppliers');
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].legalName).toBe('Sigue activo');
  });

  it('after the baja it is no longer readable by id', async () => {
    const supplier = await createSupplier({ legalName: 'CorBlock' });

    await request(app.getHttpServer()).delete(`/suppliers/${supplier.id}`);

    const response = await request(app.getHttpServer()).get(`/suppliers/${supplier.id}`);
    expect(response.status).toBe(404);
  });

  it('after the baja its cuit and legal name are free again', async () => {
    const cuit = aValidCuit();
    const supplier = await createSupplier({ legalName: 'EDASA', cuit: cuit.replace(/-/g, '') });

    await request(app.getHttpServer()).delete(`/suppliers/${supplier.id}`);

    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ legalName: 'EDASA', cuit }));

    expect(response.status).toBe(201);
    expect(response.body.id).not.toBe(supplier.id);
  });

  it('404 supplier not found', async () => {
    const response = await request(app.getHttpServer()).delete('/suppliers/1235498654');

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      statusCode: 404,
      error: 'Not Found',
      id: 1235498654,
    });
  });

  it('404 when the supplier is already inactive', async () => {
    const supplier = await createSupplier({ legalName: 'CorBlock' });
    await request(app.getHttpServer()).delete(`/suppliers/${supplier.id}`);

    // 404 y no 409: desde afuera ese proveedor ya no existe.
    const response = await request(app.getHttpServer()).delete(`/suppliers/${supplier.id}`);

    expect(response.status).toBe(404);
  });

  it('400 non-numeric id', async () => {
    const response = await request(app.getHttpServer()).delete('/suppliers/abc');

    expect(response.status).toBe(400);
  });
});
