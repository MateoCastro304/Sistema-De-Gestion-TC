import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import request from 'supertest';

import { ExchangeRateProvider } from '../../../src/subsystems/technical-catalog/core/domain/ports/exchange-rate-provider.port';
import { BcryptPasswordHasher } from '../../../src/subsystems/identity/infrastructure/external/bcrypt-password-hasher';
import { expectError } from '../../shared/contract/envelopes';
import { clearIdentityTables } from '../../shared/factories/identity-cleanup';
import { Api, signInAs } from '../../shared/harness/auth';
import { getPrisma, startTestApp, stopTestApp } from '../../shared/harness/test-app';

const FORBIDDEN_MESSAGE = 'No tenés permisos para realizar esta operación.';
const ROLES = ['JT', 'ERP', 'EC', 'ER', 'AT', 'AS'] as const;

/** Qué roles pueden con cada recurso del Sprint 1 y del Sprint 2 (contrato, "Permisos por rol"). */
const RESOURCES = [
  { name: 'suppliers', path: '/suppliers', roles: ['AT', 'EC'] },
  { name: 'process types', path: '/process-types', roles: ['AT', 'EC'] },
  { name: 'exchange rate', path: '/exchange-rate', roles: ['AT', 'EC'] },
  { name: 'categories', path: '/categories', roles: ['ERP'] },
  { name: 'factories', path: '/factories', roles: ['ERP'] },
  { name: 'managers', path: '/managers', roles: ['ERP'] },
];

describe('Authorization (all the endpoints require a session and a permission)', () => {
  let app: INestApplication;
  const clients = new Map<string, Api>();

  beforeAll(async () => {
    // Cotización del dólar: una fuente falsa, ninguna prueba sale a internet.
    const fakeProvider = { fetchCurrent: async () => ({ rate: 1385.5, quotedAt: new Date(), source: 'fake' }) };
    app = await startTestApp([{ provide: ExchangeRateProvider, useValue: fakeProvider }]);
    for (const role of ROLES) clients.set(role, await signInAs(app, role));
  });

  afterAll(async () => {
    await stopTestApp();
  });

  const as = (role: (typeof ROLES)[number]) => clients.get(role) as Api;
  const server = () => app.getHttpServer();

  describe('without a session', () => {
    it.each([
      ['GET', '/suppliers'],
      ['GET', '/suppliers/1'],
      ['POST', '/suppliers'],
      ['PATCH', '/suppliers/1'],
      ['DELETE', '/suppliers/1'],
      ['GET', '/categories'],
      ['POST', '/categories'],
      ['GET', '/categories/1'],
      ['POST', '/categories/1/restore'],
      ['GET', '/factories'],
      ['POST', '/factories'],
      ['PATCH', '/factories/1/deactivate'],
      ['GET', '/managers'],
      ['GET', '/factories/1/managers/1'],
      ['POST', '/factories/1/managers'],
      ['GET', '/process-types'],
      ['POST', '/process-types'],
      ['PATCH', '/process-types/1'],
      ['GET', '/process-types/1/history'],
      ['GET', '/exchange-rate'],
    ])('401 UNAUTHENTICATED on %s %s, also on the endpoints of Sprint 1', async (method, path) => {
      const res = await (request(server()) as unknown as Record<string, (url: string) => request.Test>)[
        method.toLowerCase()
      ](path);

      expectError(res, 401, 'Unauthorized');
      expect(res.body.code).toBe('UNAUTHENTICATED');
      expect(res.body.items).toBeUndefined();
    });
  });

  describe('route inventory: nothing is open by accident', () => {
    /** Las únicas rutas que no exigen sesión. Cualquier otra, existente o futura, tiene que dar 401. */
    const PUBLIC_ROUTES = ['POST /auth/login', 'POST /auth/refresh', 'POST /auth/logout', 'GET /health/db'];

    /** Todas las rutas registradas en la aplicación, leídas del router y no de una lista a mano. */
    function registeredRoutes(): { method: string; path: string }[] {
      const router = (app.getHttpAdapter().getInstance() as { router?: { stack: unknown[] } }).router;
      const stack = (router?.stack ?? []) as { route?: { path: string; methods: Record<string, boolean> } }[];
      return stack
        .filter((layer) => layer.route)
        .flatMap((layer) =>
          Object.keys(layer.route!.methods)
            .filter((method) => layer.route!.methods[method])
            .map((method) => ({ method: method.toUpperCase(), path: layer.route!.path })),
        );
    }

    it('finds the routes of the application, so the test below cannot pass by checking nothing', () => {
      const keys = registeredRoutes().map(({ method, path }) => `${method} ${path}`);

      expect(registeredRoutes().length).toBeGreaterThanOrEqual(25);
      expect(keys).toEqual(expect.arrayContaining(PUBLIC_ROUTES));
      expect(keys).toEqual(expect.arrayContaining(['GET /suppliers', 'GET /categories', 'PATCH /process-types/:processTypeId']));
    });

    it('401 UNAUTHENTICATED on every registered route except the public ones', async () => {
      const protectedRoutes = registeredRoutes().filter(
        ({ method, path }) => !PUBLIC_ROUTES.includes(`${method} ${path}`),
      );

      const results = await Promise.all(
        protectedRoutes.map(async ({ method, path }) => {
          const url = path.replace(/:[A-Za-z]+/g, '1');
          const res = await (request(server()) as unknown as Record<string, (u: string) => request.Test>)[
            method.toLowerCase()
          ](url);
          return { route: `${method} ${path}`, status: res.status, code: res.body?.code as string | undefined };
        }),
      );

      // Se compara contra la lista completa: si falla, el mensaje dice qué ruta quedó abierta.
      expect(results.filter(({ status, code }) => status !== 401 || code !== 'UNAUTHENTICATED')).toEqual([]);
    });
  });

  describe('the role matrix', () => {
    const cases = RESOURCES.flatMap((resource) => ROLES.map((role) => ({ ...resource, role })));

    it.each(cases)('GET $path as $role', async ({ path, roles, role }) => {
      const res = await as(role).get(path);

      if (roles.includes(role)) {
        expect(res.status).toBe(200);
      } else {
        expectError(res, 403, 'Forbidden');
        expect(res.body).toMatchObject({ code: 'FORBIDDEN', message: FORBIDDEN_MESSAGE });
        // No devuelve ningún dato de la operación pedida.
        expect(res.body.items).toBeUndefined();
        expect(res.body.id).toBeUndefined();
      }
    });

    it('403 on a write also changes nothing', async () => {
      const res = await as('JT').post('/suppliers').send({ legalName: 'No debe guardarse', supplierType: 'MATERIAL' });

      expectError(res, 403, 'Forbidden');
      expect(await getPrisma().supplier.count({ where: { legalName: 'No debe guardarse' } })).toBe(0);
    });

    it('EC inherits what AT has, and the system administrator has none of it', async () => {
      expect((await as('EC').get('/suppliers')).status).toBe(200);
      expectError(await as('AS').get('/suppliers'), 403, 'Forbidden');
    });
  });

  describe('a user with several roles has the sum of their permissions', () => {
    it('can use the resources of each of its roles and nothing else', async () => {
      const both = await signInAs(app, 'ERP', 'AT');

      expect((await both.get('/categories')).status).toBe(200);
      expect((await both.get('/suppliers')).status).toBe(200);
    });
  });

  describe('roles are read on every request, not taken from the login (RNF09)', () => {
    it('removing a role takes effect on the very next request', async () => {
      const user = await signInAs(app, 'ERP');
      expect((await user.get('/categories')).status).toBe(200);

      await getPrisma().userRole.deleteMany({ where: { userId: user.userId } });

      expectError(await user.get('/categories'), 403, 'Forbidden');
    });

    it('adding a role takes effect on the very next request', async () => {
      const user = await signInAs(app, 'JT');
      expectError(await user.get('/suppliers'), 403, 'Forbidden');

      const at = await getPrisma().role.findUniqueOrThrow({ where: { code: 'AT' } });
      await getPrisma().userRole.create({ data: { userId: user.userId, roleId: at.id } });

      expect((await user.get('/suppliers')).status).toBe(200);
    });
  });

  describe('public endpoints stay open', () => {
    it('GET /health/db needs no session', async () => {
      expect((await request(server()).get('/health/db')).status).toBe(200);
    });

    it('/auth/login, /auth/refresh and /auth/logout need no access token', async () => {
      // El login sin cuerpo falla por validación (400), no por falta de sesión (401).
      expect((await request(server()).post('/auth/login').send({})).status).toBe(400);
      expect((await request(server()).post('/auth/refresh')).status).toBe(401);
      expect((await request(server()).post('/auth/logout')).status).toBe(204);
    });
  });

  describe('with a token that is not valid', () => {
    const JWT_SECRET = () => process.env.JWT_SECRET;
    const bearer = (token: string) => request(server()).get('/suppliers').set('Authorization', `Bearer ${token}`);

    it('401 ACCESS_TOKEN_EXPIRED when the token already expired, so the client renews it', async () => {
      const user = await signInAs(app, 'AT');
      const expired = new JwtService({ secret: JWT_SECRET() }).sign({
        sub: String(user.userId),
        sid: user.sessionId,
        exp: Math.floor(Date.now() / 1000) - 10,
      });

      const res = await bearer(expired);

      expectError(res, 401, 'Unauthorized');
      expect(res.body.code).toBe('ACCESS_TOKEN_EXPIRED');
    });

    it.each([['garbage', 'not.a.jwt']])('401 UNAUTHENTICATED with a token that is %s', async (_label, token) => {
      const res = await bearer(token);

      expectError(res, 401, 'Unauthorized');
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('401 UNAUTHENTICATED with a token signed by someone else', async () => {
      const user = await signInAs(app, 'AT');
      const forged = new JwtService({ secret: 'otro-secreto-que-no-es-el-de-la-app-0123456789' }).sign({
        sub: String(user.userId),
        sid: user.sessionId,
      });

      expect((await bearer(forged)).body.code).toBe('UNAUTHENTICATED');
    });

    it('401 UNAUTHENTICATED with an unsigned token (alg none)', async () => {
      const user = await signInAs(app, 'AT');
      const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
      const payload = Buffer.from(
        JSON.stringify({ sub: String(user.userId), sid: user.sessionId, exp: Math.floor(Date.now() / 1000) + 900 }),
      ).toString('base64url');

      expect((await bearer(`${header}.${payload}.`)).body.code).toBe('UNAUTHENTICATED');
    });

    it('401 UNAUTHENTICATED when the token names the session of another user', async () => {
      const mine = await signInAs(app, 'AT');
      const theirs = await signInAs(app, 'AT');
      const mixed = new JwtService({ secret: JWT_SECRET() }).sign(
        { sub: String(mine.userId), sid: theirs.sessionId },
        { expiresIn: 900 },
      );

      expect((await bearer(mixed)).body.code).toBe('UNAUTHENTICATED');
    });

    it('401 when the Authorization header is not a Bearer token', async () => {
      const user = await signInAs(app, 'AT');

      const res = await request(server()).get('/suppliers').set('Authorization', `Basic ${user.accessToken}`);

      expect(res.body.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('the session is verified on the server on every request (D-04)', () => {
    const PASSWORD = 'Castro1977';

    it('after logout the access token stops working even though it did not expire', async () => {
      const username = `logout-${Date.now() % 100000}`;
      const user = await signInAs(app, 'AT');
      // Se reemplaza la contraseña por una real para ingresar de verdad.
      await getPrisma().user.update({
        where: { id: user.userId },
        data: { username, passwordHash: await new BcryptPasswordHasher(4).hash(PASSWORD) },
      });
      const login = await request(server()).post('/auth/login').send({ username, password: PASSWORD });
      const accessToken = login.body.accessToken as string;
      const withToken = () => request(server()).get('/suppliers').set('Authorization', `Bearer ${accessToken}`);
      expect((await withToken()).status).toBe(200);

      await request(server()).post('/auth/logout').set('Authorization', `Bearer ${accessToken}`);

      const res = await withToken();
      expectError(res, 401, 'Unauthorized');
      expect(res.body.code).toBe('UNAUTHENTICATED');
    });

    it('401 SESSION_EXPIRED after 30 minutes without activity, and the session is closed as INACTIVITY', async () => {
      const user = await signInAs(app, 'AT');
      await getPrisma().userSession.update({
        where: { id: user.sessionId },
        data: {
          startedAt: new Date(Date.now() - 60 * 60 * 1000),
          lastActivityAt: new Date(Date.now() - 31 * 60 * 1000),
        },
      });

      const res = await user.get('/suppliers');

      expectError(res, 401, 'Unauthorized');
      expect(res.body).toMatchObject({ code: 'SESSION_EXPIRED', message: 'Tu sesión expiró por inactividad' });
      expect((await getPrisma().userSession.findUniqueOrThrow({ where: { id: user.sessionId } })).endReason).toBe(
        'INACTIVITY',
      );
    });

    it('401 SESSION_EXPIRED after 7 days even if it was used non-stop, closed as EXPIRED', async () => {
      const user = await signInAs(app, 'AT');
      await getPrisma().userSession.update({
        where: { id: user.sessionId },
        data: {
          startedAt: new Date(Date.now() - 8 * 24 * 3600 * 1000),
          expiresAt: new Date(Date.now() - 1000),
          lastActivityAt: new Date(Date.now() - 60 * 1000),
        },
      });

      const res = await user.get('/suppliers');

      expect(res.body).toMatchObject({ code: 'SESSION_EXPIRED', message: 'Tu sesión expiró. Volvé a ingresar.' });
      expect((await getPrisma().userSession.findUniqueOrThrow({ where: { id: user.sessionId } })).endReason).toBe(
        'EXPIRED',
      );
    });

    it('cuts the session of a user who was deactivated, closing it as REVOKED', async () => {
      const user = await signInAs(app, 'AT');
      expect((await user.get('/suppliers')).status).toBe(200);

      await getPrisma().user.update({ where: { id: user.userId }, data: { isActive: false } });

      const res = await user.get('/suppliers');
      expectError(res, 401, 'Unauthorized');
      expect((await getPrisma().userSession.findUniqueOrThrow({ where: { id: user.sessionId } })).endReason).toBe(
        'REVOKED',
      );
    });

    it('cuts the session of a user whose employee was deactivated (RN44)', async () => {
      const user = await signInAs(app, 'AT');
      const row = await getPrisma().user.findUniqueOrThrow({ where: { id: user.userId } });

      await getPrisma().employee.update({ where: { id: row.employeeId }, data: { isActive: false } });

      expectError(await user.get('/suppliers'), 401, 'Unauthorized');
    });

    it('records the activity at most once per minute', async () => {
      const user = await signInAs(app, 'AT');
      const lastActivity = () =>
        getPrisma()
          .userSession.findUniqueOrThrow({ where: { id: user.sessionId } })
          .then((s) => s.lastActivityAt.getTime());

      const first = await lastActivity();
      await user.get('/suppliers');
      expect(await lastActivity()).toBe(first); // hace menos de un minuto: no escribe

      await getPrisma().userSession.update({
        where: { id: user.sessionId },
        data: { startedAt: new Date(Date.now() - 10 * 60 * 1000), lastActivityAt: new Date(Date.now() - 5 * 60 * 1000) },
      });
      await user.get('/suppliers');
      expect(await lastActivity()).toBeGreaterThan(Date.now() - 10 * 1000);
    });
  });

  describe('a login lockout does not cut sessions that are already open', () => {
    it('keeps working after someone fails the login of that username five times', async () => {
      // Si cortara las sesiones, cualquiera podría dejar afuera a un usuario ajeno
      // con solo fallar ingresos contra su nombre.
      const user = await signInAs(app, 'AT');
      const { username } = await getPrisma().user.findUniqueOrThrow({ where: { id: user.userId } });

      for (let i = 0; i < 5; i += 1) {
        await request(server()).post('/auth/login').send({ username, password: 'mal' });
      }
      const locked = await request(server()).post('/auth/login').send({ username, password: 'mal' });
      expect(locked.status).toBe(423);

      expect((await user.get('/suppliers')).status).toBe(200);
      await clearIdentityTables(getPrisma()).catch(() => undefined);
    });
  });
});
