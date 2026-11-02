import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { hashRefreshToken } from '../../../src/subsystems/identity/core/domain/refresh-token-secret';
import { BcryptPasswordHasher } from '../../../src/subsystems/identity/infrastructure/external/bcrypt-password-hasher';
import { expectData, expectError } from '../../shared/contract/envelopes';
import { clearIdentityTables } from '../../shared/factories/identity-cleanup';
import { getPrisma, startTestApp, stopTestApp } from '../../shared/harness/test-app';

const PASSWORD = 'Castro1977';

describe('POST /auth/login', () => {
  let app: INestApplication;
  let passwordHash: string;
  let dni = 20000000;

  beforeAll(async () => {
    app = await startTestApp();
    passwordHash = await new BcryptPasswordHasher(4).hash(PASSWORD);
  });

  afterAll(async () => {
    await clearIdentityTables(getPrisma());
    await stopTestApp();
  });

  beforeEach(async () => {
    await clearIdentityTables(getPrisma());
  });

  async function createUser(username: string, roleCodes: string[], state: { active?: boolean } = {}) {
    dni += 1;
    const employee = await getPrisma().employee.create({
      data: { firstName: 'Diego', lastName: 'Castro', dni: String(dni), position: 'EMPLOYEE', searchKey: 'diego castro' },
    });
    return getPrisma().user.create({
      data: {
        employeeId: employee.id,
        username,
        passwordHash,
        isActive: state.active ?? true,
        roles: { create: roleCodes.map((code) => ({ role: { connect: { code } } })) },
      },
    });
  }

  const login = (username: unknown, password: unknown) =>
    request(app.getHttpServer()).post('/auth/login').send({ username, password });

  describe('with the right credentials', () => {
    it('200 returns the session of the contract and sets the refresh token only in an HttpOnly cookie', async () => {
      const user = await createUser('dcastro', ['EC', 'AT']);

      const res = await login('dcastro', PASSWORD);

      const body = expectData(res, 200);
      expect(body).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: 900,
        inactivityTimeoutSeconds: 1800,
        sessionExpiresAt: expect.any(String),
        user: {
          id: user.id,
          username: 'dcastro',
          employee: { id: user.employeeId, firstName: 'Diego', lastName: 'Castro' },
          roles: ['EC', 'AT'],
          status: 'ACTIVE',
          lastAccessAt: expect.any(String),
          createdAt: user.createdAt.toISOString(),
        },
      });
      // Ni la contraseña, ni su hash, ni el refresh token viajan en el cuerpo.
      expect(res.text).not.toContain(PASSWORD);
      expect(res.text).not.toContain(passwordHash);
      expect(res.headers['cache-control']).toBe('no-store');

      const [cookie] = res.headers['set-cookie'] as unknown as string[];
      expect(cookie).toMatch(/^refresh_token=[A-Za-z0-9_-]{43};/);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Strict');
      expect(cookie).toContain('Path=/api/auth');
      expect(res.text).not.toContain(cookie.split(';')[0].split('=')[1]);
    });

    it('the session lasts 7 days and the cookie expires with it', async () => {
      await createUser('dcastro', ['AS']);

      const res = await login('dcastro', PASSWORD);

      const sessionEnd = new Date(res.body.sessionExpiresAt).getTime();
      const lastAccess = new Date(res.body.user.lastAccessAt).getTime();
      expect(sessionEnd - lastAccess).toBe(7 * 24 * 3600 * 1000);
      const [cookie] = res.headers['set-cookie'] as unknown as string[];
      const expires = /Expires=([^;]+)/.exec(cookie)?.[1] ?? '';
      expect(Math.abs(new Date(expires).getTime() - sessionEnd)).toBeLessThan(1000);
    });

    it('opens the session on the server and stores only the hash of the refresh token', async () => {
      const user = await createUser('dcastro', ['AS']);

      const res = await login('dcastro', PASSWORD);

      const sessions = await getPrisma().userSession.findMany({ where: { userId: user.id } });
      expect(sessions).toHaveLength(1);
      expect(sessions[0].endedAt).toBeNull();

      const [cookie] = res.headers['set-cookie'] as unknown as string[];
      const refreshToken = cookie.split(';')[0].split('=')[1];
      const stored = await getPrisma().refreshToken.findMany({ where: { sessionId: sessions[0].id } });
      expect(stored.map((t) => t.tokenHash)).toEqual([hashRefreshToken(refreshToken)]);
    });

    it('matches the username ignoring case', async () => {
      await createUser('dcastro', ['AS']);

      expectData(await login('DCastro', PASSWORD), 200);
    });

    it('clears the failed attempts of the user', async () => {
      await createUser('dcastro', ['AS']);
      await login('dcastro', 'mal');
      await login('dcastro', 'mal');
      expect(await getPrisma().loginAttempt.count()).toBeGreaterThan(0);

      expectData(await login('dcastro', PASSWORD), 200);

      expect(await getPrisma().loginAttempt.count()).toBe(0);
    });
  });

  describe('with wrong credentials', () => {
    it.each([
      ['a wrong password', 'dcastro', 'mal'],
      ['an unknown username', 'nadie', PASSWORD],
    ])('401 INVALID_CREDENTIALS for %s, with the same generic message', async (_label, username, password) => {
      await createUser('dcastro', ['AS']);

      const res = await login(username, password);

      expectError(res, 401, 'Unauthorized');
      expect(res.body).toMatchObject({ code: 'INVALID_CREDENTIALS', message: 'Usuario o contraseña incorrectos' });
      expect(await getPrisma().userSession.count()).toBe(0);
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('401 INVALID_CREDENTIALS for a deactivated user, even with the right password, and no session', async () => {
      await createUser('baja', ['AS'], { active: false });

      const res = await login('baja', PASSWORD);

      expectError(res, 401, 'Unauthorized');
      expect(res.body.code).toBe('INVALID_CREDENTIALS');
      expect(await getPrisma().userSession.count()).toBe(0);
    });
  });

  describe('with incomplete data', () => {
    it('400 VALIDATION_ERROR names each missing field and does not count as an attempt', async () => {
      const res = await login('', '');

      expectError(res, 400, 'Bad Request', ['username', 'password']);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.details).toEqual(
        expect.arrayContaining([
          { field: 'username', message: 'Ingresá tu nombre de usuario' },
          { field: 'password', message: 'Ingresá tu contraseña' },
        ]),
      );
      expect(await getPrisma().loginAttempt.count()).toBe(0);
    });

    it('400 when the fields are missing from the body', async () => {
      const res = await request(app.getHttpServer()).post('/auth/login').send({});

      expectError(res, 400, 'Bad Request', ['username', 'password']);
    });
  });

  describe('lockout', () => {
    it('423 USER_BLOCKED with Retry-After on the 5th failed attempt, and the right password is rejected while it lasts', async () => {
      await createUser('dcastro', ['AS']);
      for (let i = 0; i < 4; i += 1) expectError(await login('dcastro', 'mal'), 401, 'Unauthorized');

      const blocked = await login('dcastro', 'mal');

      expectError(blocked, 423, 'Locked');
      expect(blocked.body.code).toBe('USER_BLOCKED');
      expect(blocked.headers['retry-after']).toBe('90');

      const stillBlocked = await login('dcastro', PASSWORD);
      expectError(stillBlocked, 423, 'Locked');
      expect(await getPrisma().userSession.count()).toBe(0);
    });

    it('counts the failures of unknown usernames too, so the lock does not reveal which users exist', async () => {
      for (let i = 0; i < 4; i += 1) await login('fantasma', 'x');

      expectError(await login('fantasma', 'x'), 423, 'Locked');
    });
  });
});
