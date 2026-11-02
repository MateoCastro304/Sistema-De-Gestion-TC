import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../../../shared/domain/authenticated-user';
import { AUTH_REQUEST_KEY, isPublicRoute } from '../../../../../shared/http/auth/auth.decorators';
import { bearerTokenOf } from '../../../../../shared/http/auth/bearer-token';
import { AuthenticateRequest } from '../../../core/application/use-cases/authenticate-request.use-case';
import { toHttpException } from '../identity-http-exception';

/**
 * Guard global de sesión (D-40): **todas** las rutas exigen un access token
 * válido y una sesión abierta, salvo las marcadas `@Public()`. Deja al usuario
 * verificado en la request para `@CurrentUser()` y para el guard de permisos.
 *
 * Se registra como `APP_GUARD` antes que `PermissionsGuard`: sin saber quién es,
 * no se puede decidir qué puede hacer.
 */
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authenticateRequest: AuthenticateRequest,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (isPublicRoute(this.reflector, context)) return true;

    const request = context.switchToHttp().getRequest<Request & { [AUTH_REQUEST_KEY]?: AuthenticatedUser }>();
    try {
      request[AUTH_REQUEST_KEY] = await this.authenticateRequest.execute({ accessToken: bearerTokenOf(request) });
    } catch (error) {
      throw toHttpException(error);
    }
    return true;
  }
}
