import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/** Propiedad de la request donde el guard deja el id del autor. */
export const AUTHOR_ID_KEY = 'authorId';

/**
 * PROVISORIO. Todavía no existe `identity` (sesión, JWT), pero el historial de
 * precios necesita saber quién hizo el cambio. Mientras tanto el autor llega en
 * el header `X-User-Id`; sin él, 401 `UNAUTHENTICATED`, como responderá el guard
 * real. Reemplazar por el guard de sesión cuando exista: el controller solo
 * necesita que alguien deje el id del usuario autenticado en la request.
 */
@Injectable()
export class ProvisionalAuthorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & { [AUTHOR_ID_KEY]?: number }>();
    const header = request.header('x-user-id');

    if (header === undefined || !/^\d+$/.test(header.trim())) {
      throw new UnauthorizedException({
        statusCode: 401,
        error: 'Unauthorized',
        code: 'UNAUTHENTICATED',
        message: 'La autenticación es requerida.',
      });
    }

    request[AUTHOR_ID_KEY] = Number(header.trim());
    return true;
  }
}
