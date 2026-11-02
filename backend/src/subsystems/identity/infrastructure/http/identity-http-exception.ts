import { HttpException, HttpStatus } from '@nestjs/common';
import { AccessTokenExpired } from '../../core/domain/errors/access-token-expired.error';
import { Forbidden } from '../../core/domain/errors/forbidden.error';
import { SessionExpired } from '../../core/domain/errors/session-expired.error';
import { Unauthenticated } from '../../core/domain/errors/unauthenticated.error';

const NAMES: Record<number, string> = {
  [HttpStatus.UNAUTHORIZED]: 'Unauthorized',
  [HttpStatus.FORBIDDEN]: 'Forbidden',
};

/**
 * Traduce los errores de sesión y permisos que lanzan los guards globales a una
 * `HttpException` con el cuerpo del contrato (`code`, `message`). Cualquier otro
 * error vuelve tal cual.
 *
 * Por qué no se dejan pasar como errores de dominio: los guards corren dentro de
 * *cada* controlador, y los filtros de módulo de proveedores, fábricas y
 * encargados atrapan toda `DomainError` y responden 500 a las que no conocen.
 * Una `HttpException` no la atrapa ninguno, y el filtro global ya le da el
 * formato de error del contrato (incluido `code`, `path` y `timestamp`).
 */
export function toHttpException(error: unknown): unknown {
  if (
    !(
      error instanceof Unauthenticated ||
      error instanceof AccessTokenExpired ||
      error instanceof SessionExpired ||
      error instanceof Forbidden
    )
  ) {
    return error;
  }

  const status = error instanceof Forbidden ? HttpStatus.FORBIDDEN : HttpStatus.UNAUTHORIZED;
  return new HttpException({ statusCode: status, error: NAMES[status], code: error.code, message: error.message }, status);
}
