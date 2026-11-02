import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseFilters } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthenticateUser } from '../../../core/application/use-cases/authenticate-user.use-case';
import { LoginRequestDto } from '../dto/login-request.dto';
import { IdentityDomainErrorFilter } from '../filters/identity-domain-error.filter';
import { RefreshCookieOptions } from '../refresh-cookie.options';
import { SessionResponse, SessionResponseBody } from '../session.response';

/** Sesión (contrato §3.1). `login` es público; el resto de los endpoints de sesión se suman en T4 y T5. */
@Controller('auth')
@UseFilters(IdentityDomainErrorFilter)
export class AuthController {
  constructor(
    private readonly authenticate: AuthenticateUser,
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

    // El refresh token viaja solo en la cookie HttpOnly, nunca en el cuerpo (D-45).
    response.cookie(this.cookies.name, session.refreshToken, this.cookies.forSet(session.sessionExpiresAt));
    // La respuesta lleva un token: que ningún navegador ni proxy la guarde.
    response.setHeader('Cache-Control', 'no-store');

    return SessionResponse.from(session);
  }
}
