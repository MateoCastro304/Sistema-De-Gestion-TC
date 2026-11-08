import { INestApplication } from '@nestjs/common';

import { expectError } from '../../shared/contract/envelopes';
import {
  TEST_EMPLOYEE_PREFIX as PREFIX,
  createEmployee,
  deleteTestEmployees,
} from '../../shared/factories/employee.factory';
import { Api, signInAs } from '../../shared/harness/auth';
import { getPrisma, startTestApp, stopTestApp } from '../../shared/harness/test-app';

/** CU-47: solo AS (`employee:manage`) consulta empleados. */
describe('GET /employees', () => {
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

  describe('the page', () => {
    it('200: returns total, page and limit, ordered by last name and first name', async () => {
      await createEmployee({ firstName: 'Beto', lastName: `${PREFIX} Rojas` });
      await createEmployee({ firstName: 'Carla', lastName: `${PREFIX} Alvarez` });
      await createEmployee({ firstName: 'Ana', lastName: `${PREFIX} Rojas` });

      const res = await as.get(`/employees?search=${PREFIX}&limit=10`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ total: 3, page: 1, limit: 10 });
      expect(
        res.body.items.map((e: { firstName: string; lastName: string }) => `${e.lastName}, ${e.firstName}`),
      ).toEqual([`${PREFIX} Alvarez, Carla`, `${PREFIX} Rojas, Ana`, `${PREFIX} Rojas, Beto`]);
    });

    it('paginates, and the total counts the whole filtered set', async () => {
      for (const firstName of ['Ana', 'Beto', 'Carla']) await createEmployee({ firstName });

      const res = await as.get(`/employees?search=${PREFIX}&page=2&limit=2`);

      expect(res.body).toMatchObject({ total: 3, page: 2, limit: 2 });
      expect(res.body.items).toHaveLength(1);
    });

    it('returns an empty list, not an error, when nothing matches', async () => {
      const res = await as.get('/employees?search=zzzninguno');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ items: [], total: 0 });
    });
  });

  describe('the filters', () => {
    it.each([
      [
        'the name, ignoring case and accents',
        { firstName: 'Julián', lastName: `${PREFIX} Núñez` },
        () => `JULIAN ${PREFIX} NUNEZ`,
      ],
      ['the dni', {}, (dni: string) => dni],
    ])('search finds by %s', async (_label, overrides, searchFor) => {
      const employee = await createEmployee(overrides);

      const res = await as.get(`/employees?search=${encodeURIComponent(searchFor(employee.dni))}`);

      expect(res.body.items.map((e: { id: number }) => e.id)).toEqual([employee.id]);
    });

    it('hides the employees dado de baja unless includeInactive is true', async () => {
      await createEmployee({ firstName: 'Activo' });
      await createEmployee({ firstName: 'Inactivo', isActive: false });

      const onlyActive = await as.get(`/employees?search=${PREFIX}`);
      const all = await as.get(`/employees?search=${PREFIX}&includeInactive=true`);

      expect(onlyActive.body.total).toBe(1);
      expect(all.body.total).toBe(2);
      expect(all.body.items.map((e: { active: boolean }) => e.active).sort()).toEqual([false, true]);
    });

    it('hasUser keeps only the employees with (or without) a user', async () => {
      // El empleado del propio usuario de la prueba tiene usuario.
      const mine = await getPrisma().user.findUniqueOrThrow({ where: { id: as.userId } });
      await createEmployee();

      const withUser = await as.get(`/employees?hasUser=true&search=${encodeURIComponent('test usuario')}&limit=100`);
      const without = await as.get(`/employees?hasUser=false&search=${PREFIX}`);

      expect(withUser.body.items.map((e: { id: number }) => e.id)).toContain(mine.employeeId);
      expect(withUser.body.items.every((e: { user: unknown }) => e.user !== null)).toBe(true);
      expect(without.body.total).toBe(1);
      expect(without.body.items.every((e: { user: unknown }) => e.user === null)).toBe(true);
    });
  });

  describe('rejects the request', () => {
    it('400 VALIDATION_ERROR on invalid query params', async () => {
      const res = await as.get('/employees?page=0&limit=1000');

      expectError(res, 400, 'Bad Request', ['page', 'limit']);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('403 for a role without employee:manage', async () => {
      const ec = await signInAs(app, 'EC');

      expectError(await ec.get('/employees'), 403, 'Forbidden');
    });
  });
});
