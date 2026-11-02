import { Injectable } from '@nestjs/common';
import { ClockPort } from '../../../../../shared/clock/clock.port';
import { RefreshToken } from '../../domain/entities/refresh-token.entity';
import { Unauthenticated } from '../../domain/errors/unauthenticated.error';
import { SessionPolicy } from '../../domain/ports/session-policy.port';
import { SessionRepository } from '../../domain/ports/session.repository';
import { TokenIssuer } from '../../domain/ports/token-issuer.port';
import { UserAuthRepository } from '../../domain/ports/user-auth.repository';
import { generateRefreshToken, hashRefreshToken } from '../../domain/refresh-token-secret';
import { assertSessionUsable } from '../assert-session-usable';
import { AuthenticatedSession, toAuthenticatedSession } from '../authenticated-session';

export type RefreshSessionCommand = {
  /** El valor de la cookie `refresh_token`; `undefined` si no llegó. */
  refreshToken: string | undefined;
};

/** Veces que se intenta rotar si otra petición se adelanta (la primera vez y una más). */
const MAX_ROTATION_ATTEMPTS = 2;

/**
 * Renovación del access token (`POST /auth/refresh`, CU-53 escenarios 5, 10, 11 y 12).
 *
 * - El refresh token **rota en cada uso**: el viejo queda revocado y el cliente
 *   recibe uno nuevo.
 * - Un token ya rotado se tolera durante el margen de gracia (30 s, D-47), para
 *   que dos pestañas que renuevan a la vez no se cierren la sesión. Pasado ese
 *   margen se lo considera robado y se cierra la sesión entera.
 * - **No cuenta como actividad** (D-46): si lo contara, un cliente abierto sin uso
 *   mantendría la sesión viva para siempre.
 * - **No extiende la sesión** (D-44): sigue venciendo 7 días después del ingreso.
 * - Devuelve los roles **vigentes**: es lo que hace que un cambio de roles se vea
 *   al recargar la página.
 *
 * Todo fallo termina en `Unauthenticated` o `SessionExpired`; el controlador
 * borra la cookie en esos casos.
 */
@Injectable()
export class RefreshSession {
  constructor(
    private readonly users: UserAuthRepository,
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenIssuer,
    private readonly policy: SessionPolicy,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: RefreshSessionCommand): Promise<AuthenticatedSession> {
    if (!command.refreshToken) throw new Unauthenticated();

    const presented = await this.sessions.findRefreshTokenByHash(hashRefreshToken(command.refreshToken));
    if (!presented) throw new Unauthenticated();

    const session = await this.sessions.findById(presented.getSessionId());
    if (!session) throw new Unauthenticated();

    const now = this.clock.now();
    await assertSessionUsable(this.sessions, this.policy, session, now);

    const use = presented.classifyUse(now, this.policy.refreshGraceSeconds);
    if (use === 'REUSED') {
      // Un token ya reemplazado reapareció fuera del margen: alguien más lo tiene.
      await this.sessions.end(session.getId(), 'REVOKED', now);
      throw new Unauthenticated();
    }

    const user = await this.users.findById(session.getUserId());
    if (!user || !user.isActive()) {
      await this.sessions.end(session.getId(), 'REVOKED', now);
      throw new Unauthenticated();
    }

    const next = generateRefreshToken();
    const first = use === 'CURRENT' ? presented : await this.sessions.findLiveRefreshToken(session.getId());
    if (!(await this.rotate(session.getId(), first, next.hash, now))) throw new Unauthenticated();

    const access = this.tokens.issue({ sub: user.getId(), sid: session.getId() });
    return toAuthenticatedSession({ user, session, access, refreshToken: next.token, policy: this.policy });
  }

  /**
   * Rota a partir del token vigente. Si otra petición se adelantó y ya lo rotó,
   * se reintenta una vez con el nuevo vigente: dos renovaciones simultáneas
   * terminan ambas bien, y la sesión queda con un único token vigente.
   */
  private async rotate(
    sessionId: string,
    firstCandidate: RefreshToken | null,
    newTokenHash: string,
    now: Date,
  ): Promise<boolean> {
    let candidate = firstCandidate;

    for (let attempt = 0; attempt < MAX_ROTATION_ATTEMPTS; attempt += 1) {
      if (!candidate) return false;

      const rotated = await this.sessions.rotateRefreshToken({
        sessionId,
        fromTokenId: candidate.getId(),
        newTokenHash,
        now,
      });
      if (rotated) return true;

      candidate = await this.sessions.findLiveRefreshToken(sessionId);
    }
    return false;
  }
}
