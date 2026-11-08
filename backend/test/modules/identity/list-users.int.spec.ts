import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { expectError } from '../../shared/contract/envelopes';
import { createEmployee, deleteTestEmployees } from '../../shared/factories/employee.factory';
import { TEST_USER_PREFIX as PREFIX, createUser, deleteTestUsers } from '../../shared/factories/user.factory';
import { Api, signInAs } from '../../shared/harness/auth';
import { startTestApp, stopTestApp } from '../../shared/harness/test-app';

const usernames = (res: { body: { items: { username: string }[] } }) => res.body.items.map((user) => user.username);

/** CU-07: solo AS (`user:manage`) consulta usuarios. */
describe('GET /users', () => {
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

  it('200: lists the page with the envelope of the contract, ordered by username', async () => {
    const [a, b] = [await createEmployee(), await createEmployee()];
    await createUser(b.id, 'b-user');
    await createUser(a.id, 'a-user');

    const res = await as.get(`/users?search=${PREFIX}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ total: 2, page: 1, limit: 20 });
    expect(usernames(res)).toEqual([`${PREFIX}a-user`, `${PREFIX}b-user`]);
  });

  it('filters by role', async () => {
    const [a, b] = [await createEmployee(), await createEmployee()];
    await createUser(a.id, 'jefe', ['JT']);
    await createUser(b.id, 'cotiza', ['EC']);

    const res = await as.get(`/users?search=${PREFIX}&role=JT`);

    expect(usernames(res)).toEqual([`${PREFIX}jefe`]);
  });

  it('searches the first and last name of the employee, without accents or case', async () => {
    const employee = await createEmployee({ firstName: 'Ñandú', lastName: 'Zzprueba Árbol' });
    await createUser(employee.id, 'sin-relacion');

    const res = await as.get(encodeURI('/users?search=ZZPRUEBA Árbol'));

    expect(usernames(res)).toEqual([`${PREFIX}sin-relacion`]);
  });

  it('hides inactive users, and those of a deactivated employee, unless includeInactive', async () => {
    const [active, inactiveUser, inactiveEmployee] = [
      await createEmployee(),
      await createEmployee(),
      await createEmployee({ isActive: false }),
    ];
    await createUser(active.id, 'activo');
    await createUser(inactiveUser.id, 'baja', ['EC'], false);
    await createUser(inactiveEmployee.id, 'empleado-baja');

    const byDefault = await as.get(`/users?search=${PREFIX}`);
    const all = await as.get(`/users?search=${PREFIX}&includeInactive=true`);

    expect(usernames(byDefault)).toEqual([`${PREFIX}activo`]);
    expect(all.body.items.map((u: { username: string; status: string }) => [u.username, u.status])).toEqual([
      [`${PREFIX}activo`, 'ACTIVE'],
      [`${PREFIX}baja`, 'INACTIVE'],
      [`${PREFIX}empleado-baja`, 'INACTIVE'],
    ]);
  });

  it('400: an unknown role code', async () => {
    const res = await as.get('/users?role=XX');

    expectError(res, 400, 'Bad Request', ['role']);
  });

  it('401 without a session', async () => {
    expectError(await request(app.getHttpServer()).get('/users'), 401, 'Unauthorized');
  });

  it('403 for a role without user:manage', async () => {
    expectError(await jt.get('/users'), 403, 'Forbidden');
  });
});
