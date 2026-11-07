import { RefreshToken } from '../../../core/domain/entities/refresh-token.entity';
import { Session } from '../../../core/domain/entities/session.entity';
import {
  OpenSessionParams,
  RotateRefreshTokenParams,
  SessionRepository,
} from '../../../core/domain/ports/session.repository';
import { SessionEndReason } from '../../../core/domain/value-objects/session-end-reason';

type StoredSession = {
  id: string;
  userId: number;
  startedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
  endedAt: Date | null;
  endReason: SessionEndReason | null;
};

type StoredToken = {
  id: string;
  tokenHash: string;
  sessionId: string;
  replacedBy: string | null;
  createdAt: Date;
  revokedAt: Date | null;
};

/** Repositorio en memoria para los tests unitarios de los casos de uso. */
export class InMemorySessionRepository extends SessionRepository {
  private readonly sessions = new Map<string, StoredSession>();
  private readonly tokens: StoredToken[] = [];
  private sequence = 0;

  open(params: OpenSessionParams): Promise<Session> {
    this.sequence += 1;
    const stored: StoredSession = {
      id: `session-${this.sequence}`,
      userId: params.userId,
      startedAt: params.now,
      lastActivityAt: params.now,
      expiresAt: params.expiresAt,
      endedAt: null,
      endReason: null,
    };
    this.sessions.set(stored.id, stored);
    this.tokens.push({
      id: `token-${this.sequence}`,
      tokenHash: params.refreshTokenHash,
      sessionId: stored.id,
      replacedBy: null,
      createdAt: params.now,
      revokedAt: null,
    });
    return Promise.resolve(Session.reconstruct(stored));
  }

  findById(sessionId: string): Promise<Session | null> {
    const stored = this.sessions.get(sessionId);
    return Promise.resolve(stored ? Session.reconstruct(stored) : null);
  }

  findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    const stored = this.tokens.find((token) => token.tokenHash === tokenHash);
    return Promise.resolve(stored ? RefreshToken.reconstruct(stored) : null);
  }

  findLiveRefreshToken(sessionId: string): Promise<RefreshToken | null> {
    const live = this.tokens.find((token) => token.sessionId === sessionId && token.revokedAt === null);
    return Promise.resolve(live ? RefreshToken.reconstruct(live) : null);
  }

  rotateRefreshToken(params: RotateRefreshTokenParams): Promise<boolean> {
    const from = this.tokens.find((token) => token.id === params.fromTokenId && token.revokedAt === null);
    if (!from) return Promise.resolve(false);

    this.sequence += 1;
    const next: StoredToken = {
      id: `token-${this.sequence}`,
      tokenHash: params.newTokenHash,
      sessionId: params.sessionId,
      replacedBy: null,
      createdAt: params.now,
      revokedAt: null,
    };
    from.revokedAt = params.now;
    from.replacedBy = next.id;
    this.tokens.push(next);
    return Promise.resolve(true);
  }

  touchActivity(sessionId: string, now: Date): Promise<void> {
    const stored = this.sessions.get(sessionId);
    if (stored && stored.endedAt === null) stored.lastActivityAt = now;
    return Promise.resolve();
  }

  end(sessionId: string, reason: SessionEndReason, now: Date): Promise<void> {
    const stored = this.sessions.get(sessionId);
    if (stored && stored.endedAt === null) {
      stored.endedAt = now;
      stored.endReason = reason;
    }
    this.tokens
      .filter((token) => token.sessionId === sessionId && token.revokedAt === null)
      .forEach((token) => (token.revokedAt = now));
    return Promise.resolve();
  }

  /** Para los asserts de los tests: cuántas sesiones se abrieron. */
  openedSessions(): Session[] {
    return [...this.sessions.values()].map((stored) => Session.reconstruct(stored));
  }
}
