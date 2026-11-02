import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../../../shared/domain/authenticated-user';
import {
  ANY_AUTHENTICATED_KEY,
  AUTH_REQUEST_KEY,
  PERMISSIONS_KEY,
  isPublicRoute,
} from '../../../../../shared/http/auth/auth.decorators';
import { Forbidden } from '../../../core/domain/errors/forbidden.error';
import { Unauthenticated } from '../../../core/domain/errors/unauthenticated.error';
import { toHttpException } from '../identity-http-exception';

/**
 * Guard global de permisos (RNF09, matriz RBAC: **denegar por defecto**).
 *
 * - Una ruta `@Public()` pasa.
 * - Una ruta `@AnyAuthenticatedUser()` pasa con cualquier sesión.
 * - Una ruta con `@RequirePermissions(...)` pasa si el usuario tiene **todos**.
 * - Una ruta que no declara nada se rechaza con 403: si alguien se olvida de
 *   declarar los permisos de un endpoint nuevo, el endpoint queda cerrado y no
 *   abierto a cualquiera con sesión.
 *
 * Los permisos son los vigentes del usuario (la suma de los de todos sus roles),
 * leídos en cada petición por `SessionAuthGuard`. Los rechazos salen como
 * `HttpException` (ver `toHttpException`).
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    if (isPublicRoute(this.reflector, context)) return true;

    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean | undefined>(ANY_AUTHENTICATED_KEY, targets) === true) return true;

    const required = this.reflector.getAllAndOverride<string[] | undefined>(PERMISSIONS_KEY, targets);
    if (!required || required.length === 0) throw toHttpException(new Forbidden());

    const user = context.switchToHttp().getRequest<Request & { [AUTH_REQUEST_KEY]?: AuthenticatedUser }>()[
      AUTH_REQUEST_KEY
    ];
    // No debería pasar: el guard de sesión corre antes. Si pasa, se cierra el acceso.
    if (!user) throw toHttpException(new Unauthenticated());

    if (!required.every((permission) => user.permissions.includes(permission))) throw toHttpException(new Forbidden());
    return true;
  }
}
