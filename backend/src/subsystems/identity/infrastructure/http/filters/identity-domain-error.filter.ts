import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { AccessTokenExpired } from '../../../core/domain/errors/access-token-expired.error';
import { Forbidden } from '../../../core/domain/errors/forbidden.error';
import { InvalidCredentials } from '../../../core/domain/errors/invalid-credentials.error';
import { SessionExpired } from '../../../core/domain/errors/session-expired.error';
import { Unauthenticated } from '../../../core/domain/errors/unauthenticated.error';
import { UserBlocked } from '../../../core/domain/errors/user-blocked.error';

type HandledError =
  | InvalidCredentials
  | UserBlocked
  | Unauthenticated
  | AccessTokenExpired
  | SessionExpired
  | Forbidden;

/**
 * Traduce los errores de sesión y autorización al cuerpo de error del contrato
 * (§5.2): `code`, `message`, `path` y `timestamp`. Solo atrapa estas clases.
 *
 * Con `UserBlocked` además responde `Retry-After` en segundos: el cliente sabe
 * cuánto esperar sin tener que adivinarlo.
 */
@Catch(InvalidCredentials, UserBlocked, Unauthenticated, AccessTokenExpired, SessionExpired, Forbidden)
export class IdentityDomainErrorFilter implements ExceptionFilter {
  private static readonly NAMES: Record<number, string> = {
    [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
    [HttpStatus.FORBIDDEN]: 'Forbidden',
    [HttpStatus.LOCKED]: 'Locked',
  };

  catch(exception: HandledError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const status = IdentityDomainErrorFilter.statusOf(exception);

    if (exception instanceof UserBlocked) response.setHeader('Retry-After', String(exception.retryAfterSeconds));

    response.status(status).json({
      statusCode: status,
      error: IdentityDomainErrorFilter.NAMES[status],
      code: exception.code,
      message: exception.message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private static statusOf(exception: HandledError): number {
    if (exception instanceof UserBlocked) return HttpStatus.LOCKED;
    if (exception instanceof Forbidden) return HttpStatus.FORBIDDEN;
    return HttpStatus.UNAUTHORIZED;
  }
}
