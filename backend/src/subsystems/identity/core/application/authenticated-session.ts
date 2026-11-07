import { AuthEmployee, AuthUser } from '../domain/entities/auth-user.entity';
import { Session } from '../domain/entities/session.entity';
import { SessionPolicy } from '../domain/ports/session-policy.port';
import { IssuedAccessToken } from '../domain/ports/token-issuer.port';

/** Usuario de la respuesta de sesión (contrato §3.1): la misma forma que `GET /users/{id}`. */
export type SessionUser = {
  id: number;
  username: string;
  employee: AuthEmployee;
  roles: readonly string[];
  status: 'ACTIVE';
  lastAccessAt: Date;
  createdAt: Date;
};

/** Lo que devuelven el login y el refresh: la sesión abierta o renovada. */
export type AuthenticatedSession = {
  accessToken: string;
  expiresIn: number;
  inactivityTimeoutSeconds: number;
  sessionExpiresAt: Date;
  /** En claro, para la cookie. En la base queda solo su hash. */
  refreshToken: string;
  user: SessionUser;
};

/**
 * Arma la respuesta de sesión. El login y el refresh devuelven la misma forma,
 * con los roles **vigentes** del usuario: así el menú refleja un cambio de roles
 * al recargar la página. `sessionExpiresAt` es el de la sesión: renovar no lo
 * corre (D-44).
 */
export function toAuthenticatedSession(params: {
  user: AuthUser;
  session: Session;
  access: IssuedAccessToken;
  refreshToken: string;
  policy: SessionPolicy;
}): AuthenticatedSession {
  const { user, session, access, refreshToken, policy } = params;
  return {
    accessToken: access.token,
    expiresIn: access.expiresIn,
    inactivityTimeoutSeconds: policy.inactivitySeconds,
    sessionExpiresAt: session.getExpiresAt(),
    refreshToken,
    user: {
      id: user.getId(),
      username: user.getUsername(),
      employee: user.getEmployee(),
      roles: user.getRoles(),
      status: 'ACTIVE',
      // El último acceso es el inicio de la sesión en curso (D-27).
      lastAccessAt: session.getStartedAt(),
      createdAt: user.getCreatedAt(),
    },
  };
}
