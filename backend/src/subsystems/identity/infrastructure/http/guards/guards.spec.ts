import { ExecutionContext, HttpException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { AuthenticatedUser } from '../../../../../shared/domain/authenticated-user';
import {
  AUTH_REQUEST_KEY,
  AnyAuthenticatedUser,
  Public,
  RequirePermissions,
} from '../../../../../shared/http/auth/auth.decorators';
import { AuthenticateRequest } from '../../../core/application/use-cases/authenticate-request.use-case';
import { AccessTokenExpired } from '../../../core/domain/errors/access-token-expired.error';
import { SessionExpired } from '../../../core/domain/errors/session-expired.error';
import { Unauthenticated } from '../../../core/domain/errors/unauthenticated.error';
import { PermissionsGuard } from './permissions.guard';
import { SessionAuthGuard } from './session-auth.guard';

/** Rutas de ejemplo con cada declaración posible. */
@RequirePermissions('supplier:manage')
class ClassWithPermission {
  inherits() {}

  @Public()
  open() {}
}

class Routes {
  @Public()
  open() {}

  @RequirePermissions('supplier:manage')
  oneRequirement() {}

  @RequirePermissions('supplier:manage', 'user:manage')
  twoRequirements() {}

  @AnyAuthenticatedUser()
  anyUser() {}

  undeclared() {}
}

const USER: AuthenticatedUser = { userId: 1, sessionId: 's-1', roles: ['AT'], permissions: ['supplier:manage'] };

type Handler = () => void;

function contextFor(handler: Handler, owner: new () => object, request: Record<string, unknown>): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => owner,
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

/** Lo que tiene que haber salido: una HttpException con el status y el `code` del contrato. */
function expectHttpError(error: unknown, status: number, code: string): void {
  expect(error).toBeInstanceOf(HttpException);
  const http = error as HttpException;
  expect(http.getStatus()).toBe(status);
  expect(http.getResponse()).toMatchObject({ statusCode: status, code, message: expect.any(String) });
}

function thrownBy(fn: () => unknown): unknown {
  try {
    fn();
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba que lanzara y no lanzó.');
}

async function rejectedBy(promise: Promise<unknown>): Promise<unknown> {
  try {
    await promise;
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba que rechazara y no rechazó.');
}

describe('SessionAuthGuard', () => {
  const authenticateRequest = { execute: jest.fn() };
  const guard = new SessionAuthGuard(new Reflector(), authenticateRequest as unknown as AuthenticateRequest);
  const routes = new Routes();

  beforeEach(() => {
    authenticateRequest.execute.mockReset();
    authenticateRequest.execute.mockResolvedValue(USER);
  });

  it('lets a public route through without looking at the token', async () => {
    await expect(guard.canActivate(contextFor(routes.open, Routes, { headers: {} }))).resolves.toBe(true);

    expect(authenticateRequest.execute).not.toHaveBeenCalled();
  });

  it('authenticates with the Bearer token and leaves the user on the request', async () => {
    const request: Record<string, unknown> = { headers: { authorization: 'Bearer abc.def.ghi' } };

    await expect(guard.canActivate(contextFor(routes.anyUser, Routes, request))).resolves.toBe(true);

    expect(authenticateRequest.execute).toHaveBeenCalledWith({ accessToken: 'abc.def.ghi' });
    expect(request[AUTH_REQUEST_KEY]).toEqual(USER);
  });

  it('answers 401 UNAUTHENTICATED when there is no Authorization header', async () => {
    authenticateRequest.execute.mockRejectedValue(new Unauthenticated());

    const error = await rejectedBy(guard.canActivate(contextFor(routes.anyUser, Routes, { headers: {} })));

    expectHttpError(error, 401, 'UNAUTHENTICATED');
    expect(authenticateRequest.execute).toHaveBeenCalledWith({ accessToken: undefined });
  });

  it('does not take another scheme for a Bearer token', async () => {
    authenticateRequest.execute.mockRejectedValue(new Unauthenticated());

    await rejectedBy(guard.canActivate(contextFor(routes.anyUser, Routes, { headers: { authorization: 'Basic abc' } })));

    expect(authenticateRequest.execute).toHaveBeenCalledWith({ accessToken: undefined });
  });

  it('answers 401 ACCESS_TOKEN_EXPIRED so the client renews the token', async () => {
    authenticateRequest.execute.mockRejectedValue(new AccessTokenExpired());

    const error = await rejectedBy(
      guard.canActivate(contextFor(routes.anyUser, Routes, { headers: { authorization: 'Bearer x' } })),
    );

    expectHttpError(error, 401, 'ACCESS_TOKEN_EXPIRED');
  });

  it.each([
    ['inactivity', 'INACTIVITY', 'Tu sesión expiró por inactividad'],
    ['expiry', 'EXPIRED', 'Tu sesión expiró. Volvé a ingresar.'],
  ] as const)('answers 401 SESSION_EXPIRED with the message of the %s', async (_label, reason, message) => {
    authenticateRequest.execute.mockRejectedValue(new SessionExpired(reason));

    const error = await rejectedBy(
      guard.canActivate(contextFor(routes.anyUser, Routes, { headers: { authorization: 'Bearer x' } })),
    );

    expectHttpError(error, 401, 'SESSION_EXPIRED');
    expect((error as HttpException).getResponse()).toMatchObject({ message });
  });

  it('does not hide an error that is not about the session, such as a database failure', async () => {
    const failure = new Error('connection refused');
    authenticateRequest.execute.mockRejectedValue(failure);

    const error = await rejectedBy(
      guard.canActivate(contextFor(routes.anyUser, Routes, { headers: { authorization: 'Bearer x' } })),
    );

    expect(error).toBe(failure);
  });
});

describe('PermissionsGuard', () => {
  const guard = new PermissionsGuard(new Reflector());
  const routes = new Routes();
  const withUser = (user?: AuthenticatedUser) => ({ headers: {}, [AUTH_REQUEST_KEY]: user });
  const forbidden = (error: unknown) => expectHttpError(error, 403, 'FORBIDDEN');

  it('lets a public route through', () => {
    expect(guard.canActivate(contextFor(routes.open, Routes, withUser()))).toBe(true);
  });

  it('lets a user with the permission through', () => {
    expect(guard.canActivate(contextFor(routes.oneRequirement, Routes, withUser(USER)))).toBe(true);
  });

  it('answers 403 FORBIDDEN to a user without the permission, with the message of the contract', () => {
    const noPermission = { ...USER, roles: ['JT'], permissions: [] };

    const error = thrownBy(() => guard.canActivate(contextFor(routes.oneRequirement, Routes, withUser(noPermission))));

    forbidden(error);
    expect((error as HttpException).getResponse()).toMatchObject({
      message: 'No tenés permisos para realizar esta operación.',
    });
  });

  it('needs every permission the route asks for, not just one', () => {
    forbidden(thrownBy(() => guard.canActivate(contextFor(routes.twoRequirements, Routes, withUser(USER)))));

    const both = { ...USER, permissions: ['supplier:manage', 'user:manage'] };
    expect(guard.canActivate(contextFor(routes.twoRequirements, Routes, withUser(both)))).toBe(true);
  });

  it('lets any user with a session through a route marked for any authenticated user', () => {
    const noPermission = { ...USER, roles: ['JT'], permissions: [] };

    expect(guard.canActivate(contextFor(routes.anyUser, Routes, withUser(noPermission)))).toBe(true);
  });

  it('denies by default: a route that declares nothing is closed, not open', () => {
    forbidden(thrownBy(() => guard.canActivate(contextFor(routes.undeclared, Routes, withUser(USER)))));
  });

  it('reads the permission declared on the controller when the route declares none', () => {
    const instance = new ClassWithPermission();

    expect(guard.canActivate(contextFor(instance.inherits, ClassWithPermission, withUser(USER)))).toBe(true);
    forbidden(
      thrownBy(() =>
        guard.canActivate(contextFor(instance.inherits, ClassWithPermission, withUser({ ...USER, permissions: [] }))),
      ),
    );
  });

  it('lets a route marked public win over the permission of its controller', () => {
    const instance = new ClassWithPermission();

    expect(guard.canActivate(contextFor(instance.open, ClassWithPermission, withUser()))).toBe(true);
  });

  it('refuses a protected route that reached it without a user, instead of letting it through', () => {
    expectHttpError(
      thrownBy(() => guard.canActivate(contextFor(routes.oneRequirement, Routes, withUser()))),
      401,
      'UNAUTHENTICATED',
    );
  });
});
