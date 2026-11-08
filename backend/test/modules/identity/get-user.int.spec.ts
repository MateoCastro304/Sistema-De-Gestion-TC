import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { expectError } from '../../shared/contract/envelopes';
import { createEmployee, deleteTestEmployees } from '../../shared/factories/employee.factory';
import { createUser, deleteTestUsers } from '../../shared/factories/user.factory';
import { Api, signInAs } from '../../shared/harness/auth';
import { getPrisma, startTestApp, stopTestApp } from '../../shared/harness/test-app';

/** CU-07: solo AS (`user:manage`) consulta un usuario. */
describe('GET /users/:userId', () => {
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

  it('200: the user, BLOCKED while there is a lock, and the start of the last session as lastAccessAt', async () => {
    const employee = await createEmployee();
    const user = await createUser(employee.id, 'bloqueado', ['AT']);
    const startedAt = new Date('2026-10-06T11:40:00.000Z');
    await getPrisma().userSession.create({
      data: { userId: user.id, startedAt, expiresAt: new Date(Date.now() + 3_600_000) },
    });
    await getPrisma().loginAttempt.create({
      data: {
        identifier: `u:${user.username}`,
        consecutiveFailures: 5,
        lastFailedAt: new Date(),
        lockedUntil: new Date(Date.now() + 600_000),
      },
    });

    const res = await as.get(`/users/${user.id}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: user.id, status: 'BLOCKED', lastAccessAt: startedAt.toISOString() });
  });

  it('200: a deactivated user is still returned, as INACTIVE', async () => {
    const employee = await createEmployee();
    const user = await createUser(employee.id, 'baja', ['AT'], false);

    const res = await as.get(`/users/${user.id}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('INACTIVE');
  });

  it('404 USER_NOT_FOUND', async () => {
    const res = await as.get('/users/2000000000');

    expectError(res, 404, 'Not Found');
    expect(res.body.code).toBe('USER_NOT_FOUND');
  });

  it('400 INVALID_PATH_PARAMETER: the id is not an integer', async () => {
    const res = await as.get('/users/abc');

    expectError(res, 400, 'Bad Request', ['userId']);
    expect(res.body.code).toBe('INVALID_PATH_PARAMETER');
    expect(res.body.details).toEqual([{ field: 'userId', message: 'Debe ser un número entero válido.' }]);
  });

  it('401 without a session', async () => {
    expectError(await request(app.getHttpServer()).get('/users/1'), 401, 'Unauthorized');
  });

  it('403 for a role without user:manage', async () => {
    expectError(await jt.get('/users/1'), 403, 'Forbidden');
  });
});
