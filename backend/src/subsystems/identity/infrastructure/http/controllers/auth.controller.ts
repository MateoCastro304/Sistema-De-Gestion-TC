import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseFilters } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Public } from '../../../../../shared/http/auth/auth.decorators';
import { bearerTokenOf } from '../../../../../shared/http/auth/bearer-token';
import { AuthenticatedSession } from '../../../core/application/authenticated-session';
import { AuthenticateUser } from '../../../core/application/use-cases/authenticate-user.use-case';
import { Logout } from '../../../core/application/use-cases/logout.use-case';
import { RefreshSession } from '../../../core/application/use-cases/refresh-session.use-case';
import { SessionExpired } from '../../../core/domain/errors/session-expired.error';
import { Unauthenticated } from '../../../core/domain/errors/unauthenticated.error';
import { LoginRequestDto } from '../dto/login-request.dto';
import { IdentityDomainErrorFilter } from '../filters/identity-domain-error.filter';
import { RefreshCookieOptions } from '../refresh-cookie.options';
import { SessionResponse, SessionResponseBody } from '../session.response';

/**
 * Sesión (contrato §3.1). Los tres endpoints son públicos: no exigen access
 * token, porque son los que lo obtienen, lo renuevan y lo cierran. Sus errores
 * los traduce `IdentityDomainErrorFilter`.
 */
@Public()
@Controller('auth')
@UseFilters(IdentityDomainErrorFilter)
export class AuthController {
  constructor(
    private readonly authenticate: AuthenticateUser,
    private readonly refreshSession: RefreshSession,
    private readonly logoutSession: Logout,
    private readonly cookies: RefreshCookieOptions,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponseBody> {
    const session = await this.authenticate.execute({
      username: body.username,
      password: body.password,
      ip: request.ip ?? 'unknown',
    });

    return this.respondWith(session, response);
  }

  /** No lleva cuerpo ni `Authorization`: la sesión se identifica con la cookie `refresh_token`. */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<SessionResponseBody> {
    const cookies = request.cookies as Record<string, string | undefined> | undefined;

    try {
      const session = await this.refreshSession.execute({ refreshToken: cookies?.[this.cookies.name] });
      return this.respondWith(session, response);
    } catch (error) {
      // Una cookie que ya no sirve se borra, para que el navegador deje de mandarla.
      if (error instanceof Unauthenticated || error instanceof SessionExpired) {
        response.clearCookie(this.cookies.name, this.cookies.forClear());
      }
      throw error;
    }
  }

  /**
   * Siempre `204`, nunca `401` (D-09): con la sesión vencida, ya cerrada o sin
   * ningún token, quien se va igual queda sin sesión. Identifica la sesión por la
   * cookie o, si no llega, por el access token.
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const cookies = request.cookies as Record<string, string | undefined> | undefined;

    await this.logoutSession.execute({
      refreshToken: cookies?.[this.cookies.name],
      accessToken: bearerTokenOf(request),
    });

    response.clearCookie(this.cookies.name, this.cookies.forClear());
  }

  private respondWith(session: AuthenticatedSession, response: Response): SessionResponseBody {
    // El refresh token viaja solo en la cookie HttpOnly, nunca en el cuerpo (D-45).
    response.cookie(this.cookies.name, session.refreshToken, this.cookies.forSet(session.sessionExpiresAt));
    // La respuesta lleva un token: que ningún navegador ni proxy la guarde.
    response.setHeader('Cache-Control', 'no-store');

    return SessionResponse.from(session);
  }
}
