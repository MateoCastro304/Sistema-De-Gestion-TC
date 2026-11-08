import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { hashRefreshToken } from '../../../src/subsystems/identity/core/domain/refresh-token-secret';
import { BcryptPasswordHasher } from '../../../src/subsystems/identity/infrastructure/external/bcrypt-password-hasher';
import { expectData, expectError } from '../../shared/contract/envelopes';
import { clearIdentityTables } from '../../shared/factories/identity-cleanup';
import { getPrisma, startTestApp, stopTestApp } from '../../shared/harness/test-app';

const PASSWORD = 'Castro1977';

describe('POST /auth/refresh', () => {
  let app: INestApplication;
  let passwordHash: string;
  let dni = 30000000;

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

  async function createUser(username: string, roleCodes: string[]) {
    dni += 1;
    const employee = await getPrisma().employee.create({
      data: { firstName: 'Diego', lastName: 'Castro', dni: String(dni), position: 'EMPLOYEE', searchKey: 'diego castro' },
    });
    return getPrisma().user.create({
      data: {
        employeeId: employee.id,
        username,
        passwordHash,
        roles: { create: roleCodes.map((code) => ({ role: { connect: { code } } })) },
      },
    });
  }

  /** Cuerpo de `Set-Cookie` -> valor del refresh token. */
  const tokenOf = (res: request.Response): string => {
    const [cookie] = res.headers['set-cookie'] as unknown as string[];
    return cookie.split(';')[0].split('=')[1];
  };

  async function loginAs(username = 'dcastro', roles = ['EC', 'AT']) {
    const user = await createUser(username, roles);
    const res = await request(app.getHttpServer()).post('/auth/login').send({ username, password: PASSWORD });
    expectData(res, 200);
    return { user, loginBody: res.body, refreshToken: tokenOf(res) };
  }

  const refreshWith = (refreshToken?: string) => {
    const req = request(app.getHttpServer()).post('/auth/refresh');
    return refreshToken === undefined ? req : req.set('Cookie', `refresh_token=${refreshToken}`);
  };

  describe('with a valid cookie', () => {
    it('200 returns a new access token, the same session shape and a new cookie', async () => {
      const { user, loginBody, refreshToken } = await loginAs();

      const res = await refreshWith(refreshToken);

      const body = expectData(res, 200);
      expect(body).toEqual({
        accessToken: expect.any(String),
        tokenType: 'Bearer',
        expiresIn: 900,
        inactivityTimeoutSeconds: 1800,
        sessionExpiresAt: loginBody.sessionExpiresAt,
        user: loginBody.user,
      });
      expect(body.user.id).toBe(user.id);
      expect(res.headers['cache-control']).toBe('no-store');
      expect(tokenOf(res)).not.toBe(refreshToken);
      expect(res.text).not.toContain(tokenOf(res));
    });

    it('rotates the token in the database: one session, the old token revoked and replaced, a single live token', async () => {
      const { refreshToken } = await loginAs();

      const res = await refreshWith(refreshToken);

      expect(await getPrisma().userSession.count()).toBe(1);
      const old = await getPrisma().refreshToken.findUniqueOrThrow({ where: { tokenHash: hashRefreshToken(refreshToken) } });
      const next = await getPrisma().refreshToken.findUniqueOrThrow({ where: { tokenHash: hashRefreshToken(tokenOf(res)) } });
      expect(old.revokedAt).not.toBeNull();
      expect(old.replacedBy).toBe(next.id);
      expect(await getPrisma().refreshToken.count({ where: { revokedAt: null } })).toBe(1);
    });

    it('does not count as activity and does not extend the session', async () => {
      const { refreshToken } = await loginAs();
      const before = await getPrisma().userSession.findFirstOrThrow();

      await refreshWith(refreshToken);

      const after = await getPrisma().userSession.findFirstOrThrow();
      expect(after.lastActivityAt).toEqual(before.lastActivityAt);
      expect(after.expiresAt).toEqual(before.expiresAt);
    });

    it('returns the roles the user has now, not the ones from the login', async () => {
      const { user, refreshToken } = await loginAs('dcastro', ['EC']);
      await getPrisma().userRole.deleteMany({ where: { userId: user.id } });
      await getPrisma().userRole.create({ data: { userId: user.id, roleId: (await roleId('AS')) } });

      const res = await refreshWith(refreshToken);

      expect(expectData(res, 200).user.roles).toEqual(['AS']);
    });

    it('two renewals at the same time both succeed and leave a single live token', async () => {
      // Dos pestañas que renuevan a la vez con la misma cookie (D-47).
      const { refreshToken } = await loginAs();

      const [first, second] = await Promise.all([refreshWith(refreshToken), refreshWith(refreshToken)]);

      expect([first.status, second.status]).toEqual([200, 200]);
      expect(await getPrisma().refreshToken.count({ where: { revokedAt: null } })).toBe(1);
      expect((await getPrisma().userSession.findFirstOrThrow()).endedAt).toBeNull();
    });
  });

  async function roleId(code: string): Promise<number> {
    return (await getPrisma().role.findUniqueOrThrow({ where: { code } })).id;
  }

  describe('with the previous token (D-47)', () => {
    it('tolerates it right after the rotation', async () => {
      const { refreshToken } = await loginAs();
      await refreshWith(refreshToken);

      expectData(await refreshWith(refreshToken), 200);
    });

    it('401 UNAUTHENTICATED after the margin: closes the whole session as REVOKED and clears the cookie', async () => {
      const { refreshToken } = await loginAs();
      const rotated = await refreshWith(refreshToken);
      // Retrocede la rotación 31 segundos: fuera del margen.
      await getPrisma().refreshToken.update({
        where: { tokenHash: hashRefreshToken(refreshToken) },
        data: { revokedAt: new Date(Date.now() - 31 * 1000) },
      });

      const res = await refreshWith(refreshToken);

      expectError(res, 401, 'Unauthorized');
      expect(res.body.code).toBe('UNAUTHENTICATED');
      expect((await getPrisma().userSession.findFirstOrThrow()).endReason).toBe('REVOKED');
      const [cleared] = res.headers['set-cookie'] as unknown as string[];
      expect(cleared).toMatch(/^refresh_token=;/);
      expect(cleared).toContain('Path=/api/auth');
      // El token nuevo tampoco sirve.
      expectError(await refreshWith(tokenOf(rotated)), 401, 'Unauthorized');
    });
  });

  describe('when the cookie cannot be used', () => {
    it.each([
      ['is missing', undefined],
      ['is unknown', 'a'.repeat(43)],
    ])('401 UNAUTHENTICATED when it %s', async (_label, token) => {
      const res = await refreshWith(token);

      expectError(res, 401, 'Unauthorized');
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('401 SESSION_EXPIRED after 30 minutes without activity, closing the session as INACTIVITY', async () => {
      const { refreshToken } = await loginAs();
      const session = await getPrisma().userSession.findFirstOrThrow();
      await getPrisma().userSession.update({
        where: { id: session.id },
        data: {
          startedAt: new Date(Date.now() - 40 * 60 * 1000),
          lastActivityAt: new Date(Date.now() - 31 * 60 * 1000),
        },
      });

      const res = await refreshWith(refreshToken);

      expectError(res, 401, 'Unauthorized');
      expect(res.body).toMatchObject({ code: 'SESSION_EXPIRED', message: 'Tu sesión expiró por inactividad' });
      expect((await getPrisma().userSession.findFirstOrThrow()).endReason).toBe('INACTIVITY');
      expect((res.headers['set-cookie'] as unknown as string[])[0]).toMatch(/^refresh_token=;/);
    });

    it('401 SESSION_EXPIRED after 7 days, closing the session as EXPIRED', async () => {
      const { refreshToken } = await loginAs();
      const session = await getPrisma().userSession.findFirstOrThrow();
      await getPrisma().userSession.update({
        where: { id: session.id },
        data: {
          startedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
          expiresAt: new Date(Date.now() - 1000),
          lastActivityAt: new Date(Date.now() - 60 * 1000),
        },
      });

      const res = await refreshWith(refreshToken);

      expect(res.body).toMatchObject({ code: 'SESSION_EXPIRED', message: 'Tu sesión expiró. Volvé a ingresar.' });
      expect((await getPrisma().userSession.findFirstOrThrow()).endReason).toBe('EXPIRED');
    });

    it('401 UNAUTHENTICATED when the user was deactivated, closing the session as REVOKED', async () => {
      const { user, refreshToken } = await loginAs();
      await getPrisma().user.update({ where: { id: user.id }, data: { isActive: false } });

      const res = await refreshWith(refreshToken);

      expectError(res, 401, 'Unauthorized');
      expect((await getPrisma().userSession.findFirstOrThrow()).endReason).toBe('REVOKED');
    });
  });
});
