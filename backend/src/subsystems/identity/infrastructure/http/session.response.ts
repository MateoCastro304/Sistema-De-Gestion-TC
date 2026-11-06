import { AuthenticatedSession } from '../../core/application/authenticated-session';

/** Cuerpo de `POST /auth/login` y `POST /auth/refresh` (Session). El refresh token no viaja acá: va en la cookie. */
export type SessionResponseBody = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  inactivityTimeoutSeconds: number;
  sessionExpiresAt: string;
  user: {
    id: number;
    username: string;
    employee: { id: number; firstName: string; lastName: string };
    roles: readonly string[];
    status: 'ACTIVE';
    lastAccessAt: string;
    createdAt: string;
  };
};

export class SessionResponse {
  static from(session: AuthenticatedSession): SessionResponseBody {
    return {
      accessToken: session.accessToken,
      tokenType: 'Bearer',
      expiresIn: session.expiresIn,
      inactivityTimeoutSeconds: session.inactivityTimeoutSeconds,
      sessionExpiresAt: session.sessionExpiresAt.toISOString(),
      user: {
        id: session.user.id,
        username: session.user.username,
        employee: session.user.employee,
        roles: session.user.roles,
        status: session.user.status,
        lastAccessAt: session.user.lastAccessAt.toISOString(),
        createdAt: session.user.createdAt.toISOString(),
      },
    };
  }
}
