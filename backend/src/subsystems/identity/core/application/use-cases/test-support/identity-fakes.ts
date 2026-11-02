import { ClockPort } from '../../../../../../shared/clock/clock.port';
import { AuthUser } from '../../../domain/entities/auth-user.entity';
import { Unauthenticated } from '../../../domain/errors/unauthenticated.error';
import { PasswordHasher } from '../../../domain/ports/password-hasher.port';
import { SessionPolicy } from '../../../domain/ports/session-policy.port';
import { AccessTokenClaims, IssuedAccessToken, TokenIssuer } from '../../../domain/ports/token-issuer.port';

export const T0 = new Date('2026-11-02T10:00:00.000Z');

/** Reloj que el test mueve a mano. */
export class FixedClock extends ClockPort {
  constructor(private current: Date = T0) {
    super();
  }

  now(): Date {
    return this.current;
  }

  advanceSeconds(seconds: number): void {
    this.current = new Date(this.current.getTime() + seconds * 1000);
  }

  today(): string {
    return this.current.toISOString().slice(0, 10);
  }

  endOfDay(date: string): Date {
    return new Date(`${date}T23:59:59.999Z`);
  }
}

/** Hasher sin costo: el "hash" es la contraseña con un prefijo. Registra las verificaciones. */
export class FakePasswordHasher extends PasswordHasher {
  readonly verifications: { plain: string; hash: string }[] = [];

  hash(plain: string): Promise<string> {
    return Promise.resolve(`hashed:${plain}`);
  }

  verify(plain: string, hash: string): Promise<boolean> {
    this.verifications.push({ plain, hash });
    return Promise.resolve(hash === `hashed:${plain}`);
  }
}

/** Emisor que arma el token como texto legible, para asertar sobre los claims sin firmar nada. */
export class FakeTokenIssuer extends TokenIssuer {
  issue(claims: AccessTokenClaims): IssuedAccessToken {
    return { token: `access:${claims.sub}:${claims.sid}`, expiresIn: 900 };
  }

  verify(token: string): AccessTokenClaims {
    const match = /^access:(\d+):(.+)$/.exec(token);
    if (!match) throw new Unauthenticated();
    return { sub: Number(match[1]), sid: match[2] };
  }

  verifyIgnoringExpiration(token: string): AccessTokenClaims {
    return this.verify(token);
  }
}

export class FakeSessionPolicy extends SessionPolicy {
  readonly inactivitySeconds = 1800;
  readonly maxLifetimeSeconds = 604800;
  readonly refreshGraceSeconds = 30;
  readonly activityWriteIntervalSeconds = 60;
}

/** Usuario de prueba con contraseña `Castro1977`, activo y con el rol AS salvo que se pise. */
export function anAuthUser(overrides: Partial<Parameters<typeof AuthUser.reconstruct>[0]> = {}): AuthUser {
  return AuthUser.reconstruct({
    id: 1,
    username: 'dcastro',
    passwordHash: 'hashed:Castro1977',
    active: true,
    employee: { id: 10, firstName: 'Diego', lastName: 'Castro' },
    roles: ['AS'],
    permissions: ['user:manage', 'employee:manage'],
    createdAt: new Date('2026-03-12T12:00:00.000Z'),
    ...overrides,
  });
}
