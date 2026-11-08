import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { ROLES } from '../../../src/subsystems/identity/core/domain/value-objects/role.vo';
import { expectError } from '../../shared/contract/envelopes';
import { createEmployee, deleteTestEmployees } from '../../shared/factories/employee.factory';
import { TEST_USER_PREFIX as PREFIX, createUser, deleteTestUsers } from '../../shared/factories/user.factory';
import { Api, signInAs } from '../../shared/harness/auth';
import { getPrisma, startTestApp, stopTestApp } from '../../shared/harness/test-app';

/** CU-05: solo AS (`user:manage`) registra usuarios. */
describe('POST /users', () => {
  let app: INestApplication;
  let as: Api;
  let jt: Api;

  beforeAll(async () => {
    app = await startTestApp();
    as = await signInAs(app, 'AS');
    jt = await signInAs(app, 'JT');
  });

  afterAll(async () => {
    await deleteTestUsers();
    await deleteTestEmployees();
    await stopTestApp();
  });

  beforeEach(async () => {
    await deleteTestUsers();
    await deleteTestEmployees();
  });

  const body = (employeeId: number, overrides: Record<string, unknown> = {}) => ({
    employeeId,
    username: `${PREFIX}mcastro`,
    password: 'Tz8kq4Rmw2',
    roles: ['EC', 'ER'],
    ...overrides,
  });

  describe('registers the user', () => {
    it('201: active, with the fields of the contract, and never returns the password', async () => {
      const employee = await createEmployee({ firstName: 'Matías', lastName: 'Zzprueba Castro' });

      const res = await as.post('/users').send(body(employee.id));

      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: expect.any(Number),
        username: `${PREFIX}mcastro`,
        employee: { id: employee.id, firstName: 'Matías', lastName: 'Zzprueba Castro' },
        roles: ['EC', 'ER'],
        status: 'ACTIVE',
        lastAccessAt: null,
        createdAt: expect.any(String),
      });
      expect(JSON.stringify(res.body)).not.toMatch(/password|Tz8kq4Rmw2/i);

      const stored = await getPrisma().user.findUniqueOrThrow({ where: { id: res.body.id } });
      expect(stored.passwordHash).not.toBe('Tz8kq4Rmw2');
      expect(stored.createdByUserId).toBe(as.userId);
    });

    it('201: returns the roles in the order of the contract, whatever the order sent', async () => {
      const employee = await createEmployee();

      const res = await as.post('/users').send(body(employee.id, { roles: ['AS', 'JT', 'EC'] }));

      expect(res.status).toBe(201);
      expect(res.body.roles).toEqual(['JT', 'EC', 'AS']);
    });

    it('201: saves the username in lowercase, which the database requires', async () => {
      const employee = await createEmployee();

      const res = await as.post('/users').send(body(employee.id, { username: `${PREFIX}MCastro` }));

      expect(res.status).toBe(201);
      expect(res.body.username).toBe(`${PREFIX}mcastro`);
    });

    it('the new user can sign in right away with the password it was given (D-25)', async () => {
      const employee = await createEmployee();
      const created = await as.post('/users').send(body(employee.id));
      expect(created.status).toBe(201);

      const login = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ username: `${PREFIX}mcastro`, password: 'Tz8kq4Rmw2' });

      expect(login.status).toBe(200);
    });

    it('ROLES matches the roles seeded in the database, in the same order', async () => {
      const seeded = await getPrisma().role.findMany({ orderBy: { sortOrder: 'asc' }, select: { code: true } });

      expect(seeded.map((role) => role.code)).toEqual([...ROLES]);
    });
  });

  describe('validation', () => {
    it('400: reports the required fields that are missing', async () => {
      const res = await as.post('/users').send({});

      expectError(res, 400, 'Bad Request', ['employeeId', 'username', 'password', 'roles']);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });

    it('400: an unknown role code', async () => {
      const employee = await createEmployee();

      const res = await as.post('/users').send(body(employee.id, { roles: ['XX'] }));

      expectError(res, 400, 'Bad Request', ['roles']);
    });

    it('400: an employee that does not exist, on the employeeId field', async () => {
      const res = await as.post('/users').send(body(2_000_000_000));

      expectError(res, 400, 'Bad Request', ['employeeId']);
      expect(res.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('conflicts', () => {
    it('409 USERNAME_TAKEN: the name is taken, ignoring case, even by an inactive user', async () => {
      const first = await createEmployee();
      await createUser(first.id, 'mcastro', ['EC'], false);
      const second = await createEmployee();

      const res = await as.post('/users').send(body(second.id, { username: `${PREFIX}MCastro` }));

      expectError(res, 409, 'Conflict', ['username']);
      expect(res.body.code).toBe('USERNAME_TAKEN');
    });

    it('409 EMPLOYEE_ALREADY_HAS_USER: names the existing user', async () => {
      const employee = await createEmployee();
      await createUser(employee.id, 'gtorres');

      const res = await as.post('/users').send(body(employee.id));

      expectError(res, 409, 'Conflict', ['employeeId']);
      expect(res.body.code).toBe('EMPLOYEE_ALREADY_HAS_USER');
      expect(res.body.message).toBe(`Este empleado ya tiene el usuario «${PREFIX}gtorres»`);
    });

    it('422 EMPLOYEE_INACTIVE: the employee was deactivated', async () => {
      const employee = await createEmployee({ isActive: false });

      const res = await as.post('/users').send(body(employee.id));

      expectError(res, 422, 'Unprocessable Content');
      expect(res.body.code).toBe('EMPLOYEE_INACTIVE');
    });
  });

  describe('authentication and authorization', () => {
    it('401 without a session', async () => {
      expectError(await request(app.getHttpServer()).post('/users').send({}), 401, 'Unauthorized');
    });

    it('403 for a role without user:manage', async () => {
      expectError(await jt.post('/users').send({}), 403, 'Forbidden');
    });
  });
});
