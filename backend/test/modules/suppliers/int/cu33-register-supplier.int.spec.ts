import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { startTestApp, stopTestApp, getPrisma } from '../../../shared/harness/test-app';
import { aSupplier, aValidCuit, createSupplier } from '../../../shared/factories/supplier-factory';

describe('[CU33] Register Supplier', () => {
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

  it('TC-01: Supplier registered successfully', async () => {
    const payload = aSupplier();

    const response = await request(app.getHttpServer()).post('/suppliers').send(payload);

    expect(response.status).toBe(201);

    const stored = await getPrisma().supplier.findFirst({
      where: { legalName: payload.legalName },
    });

    expect(stored).toMatchObject({
      legalName: payload.legalName,
      supplierType: payload.supplierType,
      address: payload.address,
      observation: payload.observation,
      isActive: true,
    });

    // El CUIT se guarda normalizado: 11 digitos pelados, sin los guiones que
    // viajaron en el cuerpo.
    expect(stored!.cuit).toBe(payload.cuit!.replace(/-/g, ''));
  });

  it('TC-02: Supplier with no assigned type', async () => {
    const before = await getPrisma().supplier.count();

    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ supplierType: undefined }));

    expect(response.status).toBe(400);
    expect(await getPrisma().supplier.count()).toBe(before);
  });

  it('TC-03: Duplicate supplier legal name', async () => {
    await createSupplier({ legalName: 'CorBlock' });
    const before = await getPrisma().supplier.count();

    // Distinta capitalizacion: la razon social es unica sin distinguir
    // mayusculas, igual que el indice supplier_legal_name_active_key.
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ legalName: 'corblock' }));

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ statusCode: 409, field: 'legalName' });
    expect(await getPrisma().supplier.count()).toBe(before);
  });

  it('TC-04: Duplicate cuit', async () => {
    const cuit = aValidCuit();
    await createSupplier({ legalName: 'CorBlock', cuit: cuit.replace(/-/g, '') });
    const before = await getPrisma().supplier.count();

    const response = await request(app.getHttpServer()).post('/suppliers').send(aSupplier({ cuit }));

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ statusCode: 409, field: 'cuit' });
    expect(await getPrisma().supplier.count()).toBe(before);
  });

  it('TC-05: An inactive supplier does not block its legal name or its cuit', async () => {
    const cuit = aValidCuit();
    const inactive = await createSupplier({
      legalName: 'EDASA',
      cuit: cuit.replace(/-/g, ''),
      isActive: false,
    });

    // La baja es logica y no hay reactivacion, asi que la razon social y el
    // CUIT de un proveedor dado de baja quedan libres.
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send(aSupplier({ legalName: 'EDASA', cuit }));

    expect(response.status).toBe(201);
    expect(response.body.id).not.toBe(inactive.id);
    expect(response.body.active).toBe(true);
    expect(await getPrisma().supplier.count()).toBe(2);
  });

  it('TC-06: Only legalName and supplierType are required', async () => {
    const response = await request(app.getHttpServer())
      .post('/suppliers')
      .send({ legalName: 'Minimo SA', supplierType: 'PROCESS' });

    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      legalName: 'Minimo SA',
      supplierType: 'PROCESS',
      active: true,
    });

    // Los opcionales ausentes no se serializan como null.
    expect(response.body).not.toHaveProperty('cuit');
    expect(response.body).not.toHaveProperty('observation');
  });
});
