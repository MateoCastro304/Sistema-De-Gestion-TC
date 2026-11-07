import { ExecutionContext, SetMetadata, createParamDecorator } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../domain/authenticated-user';

/** Propiedad de la request donde el guard de sesión deja al usuario verificado. */
export const AUTH_REQUEST_KEY = 'auth';

/** Clave de metadata que marca una ruta como pública (`@Public()`). */
export const IS_PUBLIC_KEY = 'auth:isPublic';
/** Clave de metadata con los permisos que exige la ruta (`@RequirePermissions()`). */
export const PERMISSIONS_KEY = 'auth:permissions';
/** Clave de metadata que marca una ruta abierta a cualquier usuario con sesión (`@AnyAuthenticatedUser()`). */
export const ANY_AUTHENTICATED_KEY = 'auth:anyAuthenticated';

/**
 * La ruta no exige sesión. Todo el backend exige sesión por defecto (D-40): solo
 * el login, el refresh, el logout y el chequeo de salud se abren con esto.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/** Si la ruta (o su controlador) es `@Public()`. Lo usan los dos guards. */
export function isPublicRoute(reflector: Reflector, context: ExecutionContext): boolean {
  return reflector.getAllAndOverride<boolean | undefined>(IS_PUBLIC_KEY, [context.getHandler(), context.getClass()]) === true;
}

/**
 * Permisos que la ruta exige (por ejemplo `supplier:manage`). Si pide varios,
 * hacen falta **todos**. Los permisos de un usuario son la suma de los de sus
 * roles, así que "AT o EC" se expresa con un permiso que tengan ambos roles.
 *
 * Una ruta con sesión que no declare ni esto ni `@AnyAuthenticatedUser()` se
 * rechaza con 403: la matriz de permisos es "denegar por defecto", y un olvido
 * tiene que cerrar el acceso, no abrirlo.
 */
export const RequirePermissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

/** La ruta sirve a cualquier usuario con sesión, sea cual sea su rol (por ejemplo cambiar la propia contraseña). */
export const AnyAuthenticatedUser = () => SetMetadata(ANY_AUTHENTICATED_KEY, true);

/** El usuario autenticado de la request. Solo existe en rutas que no son `@Public()`. */
export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthenticatedUser => {
  const request = context.switchToHttp().getRequest<Request & { [AUTH_REQUEST_KEY]?: AuthenticatedUser }>();
  const user = request[AUTH_REQUEST_KEY];
  if (!user) throw new Error('@CurrentUser() se usó en una ruta sin sesión (¿falta el guard o es @Public()?).');
  return user;
});
