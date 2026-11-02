import { Injectable } from '@nestjs/common';
import { RefreshToken as RefreshTokenRow, UserSession as SessionRow } from '../../../../../generated/prisma/client';
import { PrismaClientProvider } from '../../../../../shared/infrastructure/prisma/prisma-client.provider';
import { TransactionManagerPort } from '../../../../../shared/transaction/transaction-manager.port';
import { RefreshToken } from '../../../core/domain/entities/refresh-token.entity';
import { Session } from '../../../core/domain/entities/session.entity';
import { OpenSessionParams, SessionRepository } from '../../../core/domain/ports/session.repository';
import { SessionEndReason } from '../../../core/domain/value-objects/session-end-reason';

@Injectable()
export class PrismaSessionRepository extends SessionRepository {
  constructor(
    private readonly clients: PrismaClientProvider,
    private readonly transactions: TransactionManagerPort,
  ) {
    super();
  }

  async open(params: OpenSessionParams): Promise<Session> {
    // El create anidado es atómico: no puede quedar una sesión sin su primer token.
    const row = await this.clients.current().userSession.create({
      data: {
        userId: params.userId,
        startedAt: params.now,
        lastActivityAt: params.now,
        expiresAt: params.expiresAt,
        refreshTokens: { create: { tokenHash: params.refreshTokenHash, createdAt: params.now } },
      },
    });
    return PrismaSessionRepository.toSession(row);
  }

  async findById(sessionId: string): Promise<Session | null> {
    const row = await this.clients.current().userSession.findUnique({ where: { id: sessionId } });
    return row ? PrismaSessionRepository.toSession(row) : null;
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.clients.current().refreshToken.findUnique({ where: { tokenHash } });
    return row ? PrismaSessionRepository.toRefreshToken(row) : null;
  }

  async touchActivity(sessionId: string, now: Date): Promise<void> {
    await this.clients.current().userSession.updateMany({
      where: { id: sessionId, endedAt: null },
      data: { lastActivityAt: now },
    });
  }

  async end(sessionId: string, reason: SessionEndReason, now: Date): Promise<void> {
    await this.transactions.runInTransaction(async () => {
      const client = this.clients.current();
      // `endedAt: null` conserva el primer motivo si la sesión ya estaba cerrada.
      await client.userSession.updateMany({
        where: { id: sessionId, endedAt: null },
        data: { endedAt: now, endReason: reason },
      });
      await client.refreshToken.updateMany({
        where: { sessionId, revokedAt: null },
        data: { revokedAt: now },
      });
    });
  }

  private static toSession(row: SessionRow): Session {
    return Session.reconstruct({
      id: row.id,
      userId: row.userId,
      startedAt: row.startedAt,
      lastActivityAt: row.lastActivityAt,
      expiresAt: row.expiresAt,
      endedAt: row.endedAt,
      endReason: row.endReason,
    });
  }

  private static toRefreshToken(row: RefreshTokenRow): RefreshToken {
    return RefreshToken.reconstruct({
      id: row.id,
      tokenHash: row.tokenHash,
      sessionId: row.sessionId,
      replacedBy: row.replacedBy,
      createdAt: row.createdAt,
      revokedAt: row.revokedAt,
    });
  }
}
