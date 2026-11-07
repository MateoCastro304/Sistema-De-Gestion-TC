import { INestApplication } from '@nestjs/common';

import { expectError } from '../../shared/contract/envelopes';
import { anEmployeeBody, createEmployee, deleteTestEmployees } from '../../shared/factories/employee.factory';
import { Api, signInAs } from '../../shared/harness/auth';
import { getPrisma, startTestApp, stopTestApp } from '../../shared/harness/test-app';

/** CU-45: solo AS (`employee:manage`) registra empleados. */
describe('POST /employees', () => {
  let app: INestApplication;
  let as: Api;

  beforeAll(async () => {
    app = await startTestApp();
    as = await signInAs(app, 'AS');
  });

  afterAll(async () => {
    await deleteTestEmployees();
    await stopTestApp();
  });

  beforeEach(deleteTestEmployees);

  describe('registers the employee', () => {
    it('201: active and without a user, with the fields of the contract', async () => {
      const body = anEmployeeBody({
        address: 'Av. Colón 1820',
        email: 'jferreyra@castrotorneria.com.ar',
        phone: '+54 351 555-1013',
      });

      const res = await as.post('/employees').send(body);

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({
        id: expect.any(Number),
        firstName: 'Julián',
        lastName: body.lastName,
        dni: body.dni,
        position: 'EMPLOYEE',
        address: 'Av. Colón 1820',
        email: 'jferreyra@castrotorneria.com.ar',
        phone: '+54 351 555-1013',
        active: true,
        user: null,
      });
      expect(Number.isNaN(Date.parse(res.body.createdAt))).toBe(false);
      expect(res.body).not.toHaveProperty('createdByUserId');
    });

    it('stores the normalized search key and who registered it (D-43)', async () => {
      const body = anEmployeeBody();

      const res = await as.post('/employees').send(body);

      const stored = await getPrisma().employee.findUniqueOrThrow({ where: { id: res.body.id } });
      expect(stored.searchKey).toBe(`julian ${String(body.lastName).toLowerCase()}`);
      expect(stored.createdByUserId).toBe(as.userId);
    });

    it('stores an empty optional field as null', async () => {
      const res = await as.post('/employees').send(anEmployeeBody({ address: '', email: '  ', phone: null }));

      expect(res.status).toBe(201);
      expect(res.body).toMatchObject({ address: null, email: null, phone: null });
    });
  });

  describe('rejects the request and saves nothing', () => {
    it('400 VALIDATION_ERROR reports every missing required field', async () => {
      const before = await getPrisma().employee.count();

      const res = await as.post('/employees').send({});

      expectError(res, 400, 'Bad Request', ['firstName', 'lastName', 'dni', 'position']);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(await getPrisma().employee.count()).toBe(before);
    });

    it('400 VALIDATION_ERROR on a malformed dni and email', async () => {
      const before = await getPrisma().employee.count();

      const res = await as.post('/employees').send(anEmployeeBody({ dni: '12.345', email: 'nope' }));

      expectError(res, 400, 'Bad Request', ['dni', 'email']);
      expect(await getPrisma().employee.count()).toBe(before);
    });

    it.each([
      ['an active employee', true],
      ['an employee dado de baja (D-15)', false],
    ])('409 EMPLOYEE_DNI_TAKEN when the dni belongs to %s', async (_label, isActive) => {
      const owner = await createEmployee({ isActive });
      const before = await getPrisma().employee.count();

      const res = await as.post('/employees').send(anEmployeeBody({ dni: owner.dni }));

      expectError(res, 409, 'Conflict', ['dni']);
      expect(res.body.code).toBe('EMPLOYEE_DNI_TAKEN');
      expect(await getPrisma().employee.count()).toBe(before);
    });

    it('403 for a role without employee:manage', async () => {
      const at = await signInAs(app, 'AT');
      const body = anEmployeeBody();

      const res = await at.post('/employees').send(body);

      expectError(res, 403, 'Forbidden');
      expect(await getPrisma().employee.count({ where: { dni: body.dni } })).toBe(0);
    });
  });
});
