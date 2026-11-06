import { Injectable } from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { AccessTokenExpired } from '../../core/domain/errors/access-token-expired.error';
import { Unauthenticated } from '../../core/domain/errors/unauthenticated.error';
import { AccessTokenClaims, IssuedAccessToken, TokenIssuer } from '../../core/domain/ports/token-issuer.port';

/** Único algoritmo aceptado. Fijarlo al verificar evita que un token declare `none` u otro distinto. */
const ALGORITHM = 'HS256';

/**
 * Access token como JWT firmado con HS256. Lleva solo el usuario (`sub`) y su
 * sesión (`sid`); los roles y permisos se leen en cada petición.
 *
 * `sub` viaja como texto porque el estándar lo exige (jsonwebtoken rechaza uno
 * numérico) y se convierte de vuelta a número al verificar.
 */
@Injectable()
export class JwtTokenIssuer extends TokenIssuer {
  constructor(
    private readonly jwt: JwtService,
    private readonly expiresInSeconds: number,
  ) {
    super();
  }

  issue(claims: AccessTokenClaims): IssuedAccessToken {
    const token = this.jwt.sign(
      { sub: String(claims.sub), sid: claims.sid },
      { algorithm: ALGORITHM, expiresIn: this.expiresInSeconds },
    );
    return { token, expiresIn: this.expiresInSeconds };
  }

  verify(token: string): AccessTokenClaims {
    return this.read(token, false);
  }

  verifyIgnoringExpiration(token: string): AccessTokenClaims {
    return this.read(token, true);
  }

  private read(token: string, ignoreExpiration: boolean): AccessTokenClaims {
    let payload: { sub?: unknown; sid?: unknown };
    try {
      payload = this.jwt.verify<{ sub?: unknown; sid?: unknown }>(token, {
        algorithms: [ALGORITHM],
        ignoreExpiration,
      });
    } catch (error) {
      throw error instanceof TokenExpiredError ? new AccessTokenExpired() : new Unauthenticated();
    }

    const sub = typeof payload.sub === 'string' && /^\d+$/.test(payload.sub) ? Number(payload.sub) : null;
    if (sub === null || typeof payload.sid !== 'string' || payload.sid === '') throw new Unauthenticated();

    return { sub, sid: payload.sid };
  }
}
