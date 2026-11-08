import { Injectable } from '@nestjs/common';
import { ClockPort } from '../../../../../shared/clock/clock.port';
import { Unauthenticated } from '../../domain/errors/unauthenticated.error';
import { SessionRepository } from '../../domain/ports/session.repository';
import { TokenIssuer } from '../../domain/ports/token-issuer.port';
import { hashRefreshToken } from '../../domain/refresh-token-secret';

export type LogoutCommand = {
  /** El valor de la cookie `refresh_token`, si llegó. */
  refreshToken?: string;
  /** El access token del encabezado `Authorization`, si llegó. Solo se usa si no hay cookie válida. */
  accessToken?: string;
};

/**
 * Cierre de sesión (CU-52). Cierra la sesión **del servidor** con motivo `MANUAL`
 * y revoca su refresh token: borrar el token solo en el navegador no alcanza
 * (D-04). No toca las otras sesiones del usuario en otros equipos.
 *
 * Nunca falla (D-09): con una sesión ya vencida, ya cerrada, un token inválido o
 * ningún token, el resultado es el mismo, que el usuario quede sin sesión. Quien
 * se va no tiene por qué ver un error.
 *
 * La sesión se identifica con el refresh token o, si no sirve, con el access
 * token. Para ese se acepta que haya vencido: la firma prueba que es nuestro, y
 * cerrar de más una sesión ajena no es posible porque el token lleva su propio `sid`.
 */
@Injectable()
export class Logout {
  constructor(
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenIssuer,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: LogoutCommand): Promise<void> {
    const sessionId = await this.identifySession(command);
    if (sessionId === null) return;

    // Si la sesión ya estaba cerrada no cambia nada: conserva su primer motivo.
    await this.sessions.end(sessionId, 'MANUAL', this.clock.now());
  }

  private async identifySession(command: LogoutCommand): Promise<string | null> {
    if (command.refreshToken) {
      const stored = await this.sessions.findRefreshTokenByHash(hashRefreshToken(command.refreshToken));
      if (stored) return stored.getSessionId();
    }

    if (command.accessToken) {
      try {
        return this.tokens.verifyIgnoringExpiration(command.accessToken).sid;
      } catch (error) {
        if (!(error instanceof Unauthenticated)) throw error;
      }
    }

    return null;
  }
}
