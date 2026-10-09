import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aValidCuit, createSupplier } from '../../../shared/factories/supplier-factory';
import { SupplierType } from '../../../../src/generated/prisma/enums';

describe('[CU35] List Suppliers', () => {
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

  it('TC-01: General List', async () => {
    await createSupplier();
    await createSupplier();
    await createSupplier();
    await createSupplier();

    const response = await request(app.getHttpServer()).get('/suppliers');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ total: 4, page: 1, limit: 20 });
    expect(response.body.items).toHaveLength(4);
  });

  it('TC-02: Filter by type, exclusively', async () => {
    await createSupplier({ supplierType: SupplierType.PAINT });
    await createSupplier({ supplierType: SupplierType.PAINT });
    await createSupplier({ supplierType: SupplierType.MATERIAL });
    await createSupplier({ supplierType: SupplierType.PROCESS });

    const response = await request(app.getHttpServer()).get('/suppliers?type=PAINT');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.items.every((s: { supplierType: string }) => s.supplierType === 'PAINT')).toBe(true);
  });

  it('TC-03: Find by legal name', async () => {
    await createSupplier({ legalName: 'OxyCam' });
    await createSupplier({ legalName: 'Edasa' });
    await createSupplier({ legalName: 'Coca Cola Andina SA' });
    await createSupplier({ legalName: 'CorBlock' });

    const response = await request(app.getHttpServer()).get('/suppliers?search=co');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(2);
    expect(response.body.items.every((s: { legalName: string }) => s.legalName.toLowerCase().includes('co'))).toBe(
      true,
    );
  });

  it('TC-04: There are no suppliers', async () => {
    const response = await request(app.getHttpServer()).get('/suppliers');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ items: [], total: 0 });
  });

  it('TC-05: Inactive suppliers are excluded', async () => {
    await createSupplier({ legalName: 'Activo' });
    await createSupplier({ legalName: 'Inactivo', isActive: false });

    const response = await request(app.getHttpServer()).get('/suppliers');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].legalName).toBe('Activo');
  });

  it('TC-06: Search matches the contact name', async () => {
    await createSupplier({ legalName: 'Aceros del Sur', contactName: 'Diego Fernandez' });
    await createSupplier({ legalName: 'Otro Proveedor' });

    const response = await request(app.getHttpServer()).get('/suppliers?search=fernandez');

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].legalName).toBe('Aceros del Sur');
  });

  it('TC-07: Search matches the cuit ignoring the separators', async () => {
    const cuit = aValidCuit();
    await createSupplier({ legalName: 'Aceros del Sur', cuit: cuit.replace(/-/g, '') });
    await createSupplier({ legalName: 'Otro Proveedor' });

    // Se busca con guiones; en la base esta como 11 digitos pelados.
    const response = await request(app.getHttpServer()).get(`/suppliers?search=${cuit.slice(0, 5)}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items[0].legalName).toBe('Aceros del Sur');
  });

  it('TC-08: Paginates and reports the total of the filtered set', async () => {
    await createSupplier({ legalName: 'A Uno', supplierType: SupplierType.MATERIAL });
    await createSupplier({ legalName: 'B Dos', supplierType: SupplierType.MATERIAL });
    await createSupplier({ legalName: 'C Tres', supplierType: SupplierType.MATERIAL });
    await createSupplier({ legalName: 'D Cuatro', supplierType: SupplierType.PAINT });

    const first = await request(app.getHttpServer()).get('/suppliers?type=MATERIAL&limit=2&page=1');
    const second = await request(app.getHttpServer()).get('/suppliers?type=MATERIAL&limit=2&page=2');

    // El total cuenta los que matchean el filtro, no los de la pagina.
    expect(first.body).toMatchObject({ total: 3, page: 1, limit: 2 });
    expect(first.body.items).toHaveLength(2);
    expect(second.body).toMatchObject({ total: 3, page: 2, limit: 2 });
    expect(second.body.items).toHaveLength(1);
  });

  it('TC-09: Rejects a limit over the cap', async () => {
    const response = await request(app.getHttpServer()).get('/suppliers?limit=1000');

    expect(response.status).toBe(400);
  });

  it('TC-10: Rejects an unknown type', async () => {
    const response = await request(app.getHttpServer()).get('/suppliers?type=PAI');

    expect(response.status).toBe(400);
  });
});
