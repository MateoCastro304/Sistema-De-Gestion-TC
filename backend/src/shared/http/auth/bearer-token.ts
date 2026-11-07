import type { Request } from 'express';

/** El token de `Authorization: Bearer <token>`, o `undefined` si falta o no es un Bearer. */
export function bearerTokenOf(request: Request): string | undefined {
  const [scheme, token] = (request.headers.authorization ?? '').split(' ');
  return scheme?.toLowerCase() === 'bearer' && token ? token : undefined;
}
