import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { DEV_USERS, seedDevUsers } from '../../../src/subsystems/identity/infrastructure/bootstrap/dev-users.seed';
import { BcryptPasswordHasher } from '../../../src/subsystems/identity/infrastructure/external/bcrypt-password-hasher';
import { clearIdentityTables } from '../../shared/factories/identity-cleanup';
import { getPrisma, startTestApp, stopTestApp } from '../../shared/harness/test-app';

describe('seedDevUsers', () => {
  let app: INestApplication;
  // Costo mínimo de bcrypt: acá se prueba el seed, no la dureza del hash.
  const hasher = new BcryptPasswordHasher(4);

  beforeAll(async () => {
    app = await startTestApp();
  });

  afterAll(async () => {
    await stopTestApp();
  });

  beforeEach(async () => {
    await clearIdentityTables(getPrisma());
  });

  const login = (username: string, password: string) =>
    request(app.getHttpServer()).post('/auth/login').send({ username, password });

  it('creates one user per role, each with its own employee', async () => {
    const result = await seedDevUsers(getPrisma(), hasher);

    expect(result.created).toHaveLength(6);
    expect(result.existing).toEqual([]);

    const users = await getPrisma().user.findMany({ include: { roles: { include: { role: true } }, employee: true } });
    expect(users).toHaveLength(6);
    expect(users.map((u) => u.roles.map((r) => r.role.code)).flat().sort()).toEqual(['AS', 'AT', 'EC', 'ER', 'ERP', 'JT']);
    expect(new Set(users.map((u) => u.employeeId)).size).toBe(6);
  });

  it('gives the system administrator the administration position and no creator, as the first employee of the system', async () => {
    await seedDevUsers(getPrisma(), hasher);

    const admin = await getPrisma().user.findUniqueOrThrow({ where: { username: 'admin' }, include: { employee: true } });

    expect(admin.employee.position).toBe('ADMINISTRATION');
    expect(admin.employee.createdByUserId).toBeNull();
    expect(admin.createdByUserId).toBeNull();
  });

  it('stores only a hash of each password, never the password', async () => {
    await seedDevUsers(getPrisma(), hasher);

    for (const dev of DEV_USERS) {
      const user = await getPrisma().user.findUniqueOrThrow({ where: { username: dev.username } });

      expect(user.passwordHash).not.toContain(dev.password);
      expect(await hasher.verify(dev.password, user.passwordHash)).toBe(true);
    }
  });

  it('gives every user a different password, so one leaked credential opens only one account', () => {
    expect(new Set(DEV_USERS.map((u) => u.password)).size).toBe(DEV_USERS.length);
  });

  it('every seeded user can log in through the real endpoint with the roles of its position', async () => {
    await seedDevUsers(getPrisma(), hasher);

    for (const dev of DEV_USERS) {
      const res = await login(dev.username, dev.password);

      expect(res.status).toBe(200);
      expect(res.body.user.roles).toEqual([dev.role]);
    }
  });

  it('is idempotent: running it again creates nothing and leaves the passwords as they were', async () => {
    await seedDevUsers(getPrisma(), hasher);

    const changed = DEV_USERS.map((u) => ({ ...u, password: 'Otra-clave-9999' }));
    const second = await seedDevUsers(getPrisma(), hasher, changed);

    expect(second.created).toEqual([]);
    expect(second.existing).toHaveLength(6);
    expect(await getPrisma().user.count()).toBe(6);
    expect(await getPrisma().employee.count()).toBe(6);
    expect((await login('admin', DEV_USERS[0].password)).status).toBe(200);
    expect((await login('admin', 'Otra-clave-9999')).status).toBe(401);
  });

  it('creates only the missing users when some already exist', async () => {
    await seedDevUsers(getPrisma(), hasher);
    const row = await getPrisma().user.findUniqueOrThrow({ where: { username: 'taller' } });
    await getPrisma().userRole.deleteMany({ where: { userId: row.id } });
    await getPrisma().user.delete({ where: { id: row.id } });

    const result = await seedDevUsers(getPrisma(), hasher);

    expect(result.created).toEqual(['taller']);
    expect(result.existing).toHaveLength(5);
  });

  it('does not touch the users and employees that were not created by the seed', async () => {
    const employee = await getPrisma().employee.create({
      data: { firstName: 'Ana', lastName: 'Real', dni: '29999999', position: 'EMPLOYEE', searchKey: 'ana real' },
    });

    await seedDevUsers(getPrisma(), hasher);

    expect(await getPrisma().employee.findUnique({ where: { id: employee.id } })).not.toBeNull();
    expect(await getPrisma().employee.count()).toBe(7);
  });

  it.each(['', 'corta', 'sieteee'])('rejects the password %p: the minimum is 8 characters (RNF08)', async (password) => {
    const weak = [{ ...DEV_USERS[0], password }, ...DEV_USERS.slice(1)];

    await expect(seedDevUsers(getPrisma(), hasher, weak)).rejects.toThrow(/8 caracteres/);

    expect(await getPrisma().user.count()).toBe(0);
  });

  it('uses usernames that can be typed and are valid under the usernames rule (lowercase, up to 30 characters)', () => {
    for (const { username } of DEV_USERS) {
      expect(username).toBe(username.toLowerCase());
      expect(username.length).toBeLessThanOrEqual(30);
      expect(username).toBe(username.trim());
    }
  });
});
