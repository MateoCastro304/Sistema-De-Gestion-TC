import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

import { BcryptPasswordHasher } from '../../../src/subsystems/identity/infrastructure/external/bcrypt-password-hasher';
import { expectData, expectError, expectNoContent } from '../../shared/contract/envelopes';
import { clearIdentityTables } from '../../shared/factories/identity-cleanup';
import { getPrisma, startTestApp, stopTestApp } from '../../shared/harness/test-app';

const PASSWORD = 'Castro1977';

describe('POST /auth/logout', () => {
  let app: INestApplication;
  let passwordHash: string;
  let dni = 40000000;

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

  async function createUser(username: string) {
    dni += 1;
    const employee = await getPrisma().employee.create({
      data: { firstName: 'Diego', lastName: 'Castro', dni: String(dni), position: 'EMPLOYEE', searchKey: 'diego castro' },
    });
    return getPrisma().user.create({
      data: {
        employeeId: employee.id,
        username,
        passwordHash,
        roles: { create: [{ role: { connect: { code: 'AS' } } }] },
      },
    });
  }

  const tokenOf = (res: request.Response): string => {
    const [cookie] = res.headers['set-cookie'] as unknown as string[];
    return cookie.split(';')[0].split('=')[1];
  };

  /** Inicia sesión y devuelve lo que el cliente guarda: el access token y la cookie. */
  async function login(username = 'dcastro') {
    const res = await request(app.getHttpServer()).post('/auth/login').send({ username, password: PASSWORD });
    expectData(res, 200);
    return { accessToken: res.body.accessToken as string, refreshToken: tokenOf(res) };
  }

  const logoutWith = (credentials: { refreshToken?: string; accessToken?: string } = {}) => {
    const req = request(app.getHttpServer()).post('/auth/logout');
    if (credentials.refreshToken) req.set('Cookie', `refresh_token=${credentials.refreshToken}`);
    if (credentials.accessToken) req.set('Authorization', `Bearer ${credentials.accessToken}`);
    return req;
  };

  const refreshWith = (refreshToken: string) =>
    request(app.getHttpServer()).post('/auth/refresh').set('Cookie', `refresh_token=${refreshToken}`);

  describe('with the refresh cookie', () => {
    it('204 closes the session on the server with reason MANUAL, revokes the token and clears the cookie', async () => {
      await createUser('dcastro');
      const { refreshToken } = await login();

      const res = await logoutWith({ refreshToken });

      expectNoContent(res);
      const [cleared] = res.headers['set-cookie'] as unknown as string[];
      expect(cleared).toMatch(/^refresh_token=;/);
      expect(cleared).toContain('Path=/api/auth');
      expect(cleared).toContain('HttpOnly');

      const session = await getPrisma().userSession.findFirstOrThrow();
      expect(session.endReason).toBe('MANUAL');
      expect(session.endedAt).not.toBeNull();
      expect(await getPrisma().refreshToken.count({ where: { revokedAt: null } })).toBe(0);
    });

    it('the refresh token of the closed session no longer works (D-04)', async () => {
      await createUser('dcastro');
      const { refreshToken } = await login();
      await logoutWith({ refreshToken });

      const res = await refreshWith(refreshToken);

      expectError(res, 401, 'Unauthorized');
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('does not touch the other sessions of the same user', async () => {
      await createUser('dcastro');
      const first = await login();
      const second = await login();

      await logoutWith({ refreshToken: first.refreshToken });

      expectData(await refreshWith(second.refreshToken), 200);
      expect(await getPrisma().userSession.count({ where: { endedAt: null } })).toBe(1);
    });
  });

  describe('without the cookie', () => {
    it('204 identifies the session with the access token', async () => {
      await createUser('dcastro');
      const { accessToken } = await login();

      expectNoContent(await logoutWith({ accessToken }));

      expect((await getPrisma().userSession.findFirstOrThrow()).endReason).toBe('MANUAL');
    });

    it('204 closes the session even when the access token already expired', async () => {
      await createUser('dcastro');
      await login();
      const session = await getPrisma().userSession.findFirstOrThrow();
      // Un access token con la firma de la app, ya vencido.
      const expired = new JwtService({ secret: process.env.JWT_SECRET }).sign({
        sub: String(session.userId),
        sid: session.id,
        exp: Math.floor(Date.now() / 1000) - 60,
      });

      expectNoContent(await logoutWith({ accessToken: expired }));

      expect((await getPrisma().userSession.findFirstOrThrow()).endReason).toBe('MANUAL');
    });
  });

  describe('when there is nothing to close', () => {
    it.each([
      ['no credentials at all', {}],
      ['an unknown cookie', { refreshToken: 'a'.repeat(43) }],
      ['a garbage access token', { accessToken: 'not.a.jwt' }],
    ])('204, never 401, with %s (D-09)', async (_label, credentials) => {
      await createUser('dcastro');
      await login();

      const res = await logoutWith(credentials);

      expectNoContent(res);
      expect((await getPrisma().userSession.findFirstOrThrow()).endedAt).toBeNull();
    });

    it('204 on a second logout, and the session keeps its first end reason', async () => {
      await createUser('dcastro');
      const { refreshToken, accessToken } = await login();
      const session = await getPrisma().userSession.findFirstOrThrow();
      await getPrisma().userSession.update({
        where: { id: session.id },
        data: { endedAt: new Date(), endReason: 'INACTIVITY' },
      });

      expectNoContent(await logoutWith({ refreshToken, accessToken }));
      expectNoContent(await logoutWith({ refreshToken, accessToken }));

      expect((await getPrisma().userSession.findFirstOrThrow()).endReason).toBe('INACTIVITY');
    });
  });
});
