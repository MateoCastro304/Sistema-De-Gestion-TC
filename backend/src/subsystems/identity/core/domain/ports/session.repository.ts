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

export type RotateRefreshTokenParams = {
  sessionId: string;
  /** El token vigente que se reemplaza. */
  fromTokenId: string;
  /** SHA-256 hexadecimal del token nuevo. */
  newTokenHash: string;
  now: Date;
};

/** Sesiones del servidor y la cadena de refresh tokens de cada una. */
export abstract class SessionRepository {
  /** Abre una sesión junto con su primer refresh token, en una sola operación. */
  abstract open(params: OpenSessionParams): Promise<Session>;

  abstract findById(sessionId: string): Promise<Session | null>;

  abstract findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null>;

  /** El refresh token vigente de la sesión (el último de la cadena), o `null` si no tiene porque se cerró. */
  abstract findLiveRefreshToken(sessionId: string): Promise<RefreshToken | null>;

  /**
   * Reemplaza el token vigente por uno nuevo, de forma atómica: el viejo queda
   * revocado y apuntando a su reemplazo, y el nuevo pasa a ser el único vigente.
   *
   * Devuelve `false`, sin escribir nada, si `fromTokenId` ya no estaba vigente
   * porque otra petición lo rotó antes o la sesión se cerró. Quien llama decide
   * si reintenta con el nuevo vigente.
   */
  abstract rotateRefreshToken(params: RotateRefreshTokenParams): Promise<boolean>;

  /** Registra actividad. Quien llama decide si hace falta con `Session.needsActivityUpdate`. */
  abstract touchActivity(sessionId: string, now: Date): Promise<void>;

  /**
   * Cierra la sesión con el motivo dado y revoca su refresh token vigente. Si ya
   * estaba cerrada no hace nada: conserva el primer motivo.
   */
  abstract end(sessionId: string, reason: SessionEndReason, now: Date): Promise<void>;
}
