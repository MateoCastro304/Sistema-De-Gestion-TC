import { ArgumentsHost } from '@nestjs/common';
import { AccessTokenExpired } from '../../../core/domain/errors/access-token-expired.error';
import { Forbidden } from '../../../core/domain/errors/forbidden.error';
import { InvalidCredentials } from '../../../core/domain/errors/invalid-credentials.error';
import { SessionExpired } from '../../../core/domain/errors/session-expired.error';
import { Unauthenticated } from '../../../core/domain/errors/unauthenticated.error';
import { UserBlocked } from '../../../core/domain/errors/user-blocked.error';
import { IdentityDomainErrorFilter } from './identity-domain-error.filter';

function run(exception: Parameters<IdentityDomainErrorFilter['catch']>[0]) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const setHeader = jest.fn();
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({ url: '/auth/login' }),
      getResponse: () => ({ status, setHeader }),
    }),
  } as unknown as ArgumentsHost;

  new IdentityDomainErrorFilter().catch(exception, host);

  return { status: status.mock.calls[0][0] as number, body: json.mock.calls[0][0] as Record<string, unknown>, setHeader };
}

describe('IdentityDomainErrorFilter', () => {
  it.each([
    [new InvalidCredentials(), 401, 'Unauthorized', 'INVALID_CREDENTIALS'],
    [new Unauthenticated(), 401, 'Unauthorized', 'UNAUTHENTICATED'],
    [new AccessTokenExpired(), 401, 'Unauthorized', 'ACCESS_TOKEN_EXPIRED'],
    [new SessionExpired('INACTIVITY'), 401, 'Unauthorized', 'SESSION_EXPIRED'],
    [new Forbidden(), 403, 'Forbidden', 'FORBIDDEN'],
    [new UserBlocked(90), 423, 'Locked', 'USER_BLOCKED'],
  ])('maps %p to the error body of the contract', (exception, status, name, code) => {
    const result = run(exception);

    expect(result.status).toBe(status);
    expect(result.body).toMatchObject({
      statusCode: status,
      error: name,
      code,
      message: exception.message,
      path: '/auth/login',
    });
    expect(typeof result.body.timestamp).toBe('string');
  });

  it('tells the client how long to wait with Retry-After when the login is blocked', () => {
    const { setHeader } = run(new UserBlocked(90));

    expect(setHeader).toHaveBeenCalledWith('Retry-After', '90');
  });

  it('does not set Retry-After on any other error', () => {
    const { setHeader } = run(new InvalidCredentials());

    expect(setHeader).not.toHaveBeenCalled();
  });

  it('uses the message that matches the reason of an expired session', () => {
    expect(run(new SessionExpired('INACTIVITY')).body.message).toBe('Tu sesión expiró por inactividad');
    expect(run(new SessionExpired('EXPIRED')).body.message).toBe('Tu sesión expiró. Volvé a ingresar.');
  });
});
