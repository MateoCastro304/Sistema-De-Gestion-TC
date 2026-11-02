import { RefreshToken } from '../entities/refresh-token.entity';
import { Session } from '../entities/session.entity';
import { SessionEndReason } from '../value-objects/session-end-reason';

export type OpenSessionParams = {
  userId: number;
  /** SHA-256 hexadecimal del primer refresh token. */
  refreshTokenHash: string;
  now: Date;
  expiresAt: Date;
};

/**
 * Sesiones del servidor y la cadena de refresh tokens de cada una. Las
 * operaciones de rotación (T4) se suman cuando las pida su caso de uso.
 */
export abstract class SessionRepository {
  /** Abre una sesión junto con su primer refresh token, en una sola operación. */
  abstract open(params: OpenSessionParams): Promise<Session>;

  abstract findById(sessionId: string): Promise<Session | null>;

  abstract findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null>;

  /** Registra actividad. Quien llama decide si hace falta con `Session.needsActivityUpdate`. */
  abstract touchActivity(sessionId: string, now: Date): Promise<void>;

  /**
   * Cierra la sesión con el motivo dado y revoca su refresh token vigente. Si ya
   * estaba cerrada no hace nada: conserva el primer motivo.
   */
  abstract end(sessionId: string, reason: SessionEndReason, now: Date): Promise<void>;
}
