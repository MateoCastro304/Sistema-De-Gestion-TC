import { INestApplication } from '@nestjs/common';

import { loginAttemptKey } from '../../../src/subsystems/identity/core/domain/login-attempt-key';
import { expectError } from '../../shared/contract/envelopes';
import { createEmployee, deleteTestEmployees } from '../../shared/factories/employee.factory';
import { Api, signInAs } from '../../shared/harness/auth';
import { getPrisma, startTestApp, stopTestApp } from '../../shared/harness/test-app';

/** CU-47: solo AS (`employee:manage`) consulta un empleado. */
describe('GET /employees/:employeeId', () => {
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

  /** El empleado y el username de un usuario creado por `signInAs`. */
  const employeeOf = async (userId: number) => {
    const user = await getPrisma().user.findUniqueOrThrow({ where: { id: userId } });
    return { employeeId: user.employeeId, username: user.username };
  };

  describe('returns the employee', () => {
    it('200: with the summary of its user', async () => {
      const { employeeId, username } = await employeeOf(as.userId);

      const res = await as.get(`/employees/${employeeId}`);

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        id: employeeId,
        active: true,
        user: { id: as.userId, username, roles: ['AS'], status: 'ACTIVE' },
      });
    });

    it('with the user as null when the employee has none', async () => {
      const employee = await createEmployee();

      const res = await as.get(`/employees/${employee.id}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeNull();
    });

    it('also when it was dado de baja, with active false (D-17)', async () => {
      const employee = await createEmployee({ isActive: false });

      const res = await as.get(`/employees/${employee.id}`);

      expect(res.status).toBe(200);
      expect(res.body.active).toBe(false);
    });
  });

  describe('the user of the employee', () => {
    it('is INACTIVE when its employee was dado de baja (D-26)', async () => {
      const other = await signInAs(app, 'ER');
      const { employeeId } = await employeeOf(other.userId);
      await getPrisma().employee.update({ where: { id: employeeId }, data: { isActive: false } });

      const res = await as.get(`/employees/${employeeId}`);

      expect(res.body.user.status).toBe('INACTIVE');
    });

    it('is BLOCKED while its login lock is in force', async () => {
      const other = await signInAs(app, 'JT');
      const { employeeId, username } = await employeeOf(other.userId);
      await getPrisma().loginAttempt.create({
        data: {
          identifier: loginAttemptKey('username', { username, ip: '' }),
          consecutiveFailures: 5,
          lastFailedAt: new Date(),
          lockedUntil: new Date(Date.now() + 10 * 60 * 1000),
        },
      });

      const res = await as.get(`/employees/${employeeId}`);

      expect(res.body.user.status).toBe('BLOCKED');
    });

    it('lists its roles in the order of the prototype', async () => {
      const other = await signInAs(app, 'AS', 'JT', 'EC');
      const { employeeId } = await employeeOf(other.userId);

      const res = await as.get(`/employees/${employeeId}`);

      expect(res.body.user.roles).toEqual(['JT', 'EC', 'AS']);
    });
  });

  describe('rejects the request', () => {
    it('400 INVALID_PATH_PARAMETER when the id is not a number', async () => {
      const res = await as.get('/employees/abc');

      expectError(res, 400, 'Bad Request', ['employeeId']);
      expect(res.body.code).toBe('INVALID_PATH_PARAMETER');
    });

    it('404 EMPLOYEE_NOT_FOUND when it does not exist', async () => {
      const res = await as.get('/employees/2000000000');

      expectError(res, 404, 'Not Found');
      expect(res.body.code).toBe('EMPLOYEE_NOT_FOUND');
    });

    it('403 for a role without employee:manage', async () => {
      const erp = await signInAs(app, 'ERP');

      expectError(await erp.get('/employees/1'), 403, 'Forbidden');
    });
  });
});
