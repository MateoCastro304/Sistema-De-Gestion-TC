/** Lo que lleva el access token: el usuario (`sub`) y su sesión del servidor (`sid`). */
export type AccessTokenClaims = { sub: number; sid: string };

export type IssuedAccessToken = { token: string; expiresIn: number };

/**
 * Emite y verifica el access token (JWT de 15 minutos). Los roles y permisos no
 * viajan en el token: se leen en cada petición para que reflejen los vigentes.
 */
export abstract class TokenIssuer {
  abstract issue(claims: AccessTokenClaims): IssuedAccessToken;

  /**
   * @throws `AccessTokenExpired` si el token es válido pero venció.
   * @throws `Unauthenticated` si no es un token nuestro, está adulterado o no trae los claims.
   */
  abstract verify(token: string): AccessTokenClaims;
}
