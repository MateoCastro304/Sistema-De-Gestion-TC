import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { parseDurationSeconds } from '../../../shared/config/parse-duration';
import { ClockPort } from '../../../shared/clock/clock.port';
import { SystemClock } from '../../../shared/clock/system-clock';
import { PrismaClientProvider } from '../../../shared/infrastructure/prisma/prisma-client.provider';
import { AuthenticateUser } from '../core/application/use-cases/authenticate-user.use-case';
import { RefreshSession } from '../core/application/use-cases/refresh-session.use-case';
import { LoginThrottle } from '../core/domain/ports/login-throttle.port';
import { PasswordHasher } from '../core/domain/ports/password-hasher.port';
import { SessionPolicy } from '../core/domain/ports/session-policy.port';
import { SessionRepository } from '../core/domain/ports/session.repository';
import { TokenIssuer } from '../core/domain/ports/token-issuer.port';
import { UserAuthRepository } from '../core/domain/ports/user-auth.repository';
import { ConfigSessionPolicy } from './config/config-session-policy';
import { loginLockTiers } from './config/login-lock-tiers';
import { BcryptPasswordHasher, DEFAULT_BCRYPT_COST } from './external/bcrypt-password-hasher';
import { JwtTokenIssuer } from './external/jwt-token-issuer';
import { AuthController } from './http/controllers/auth.controller';
import { RefreshCookieOptions } from './http/refresh-cookie.options';
import { PrismaLoginThrottle } from './persistence/prisma/prisma-login-throttle';
import { PrismaSessionRepository } from './persistence/prisma/prisma-session.repository';
import { PrismaUserAuthRepository } from './persistence/prisma/prisma-user-auth.repository';

/**
 * ConfigService ya devuelve los valores validados y convertidos (un entero llega
 * como número). Los adaptadores leen todo como texto, que es como vive en el
 * entorno, así que se normaliza acá.
 */
const readerOf = (config: ConfigService) => (key: string) => {
  const value = config.get<string | number>(key);
  return value === undefined ? undefined : String(value);
};

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ secret: config.getOrThrow<string>('JWT_SECRET') }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthenticateUser,
    RefreshSession,
    { provide: UserAuthRepository, useClass: PrismaUserAuthRepository },
    { provide: SessionRepository, useClass: PrismaSessionRepository },
    {
      provide: PasswordHasher,
      useFactory: (config: ConfigService) =>
        new BcryptPasswordHasher(Number(config.get('BCRYPT_COST') ?? DEFAULT_BCRYPT_COST)),
      inject: [ConfigService],
    },
    {
      provide: TokenIssuer,
      useFactory: (jwt: JwtService, config: ConfigService) =>
        new JwtTokenIssuer(jwt, parseDurationSeconds(readerOf(config)('JWT_EXPIRATION') ?? '15m')),
      inject: [JwtService, ConfigService],
    },
    {
      provide: SessionPolicy,
      useFactory: (config: ConfigService) => ConfigSessionPolicy.fromEnv(readerOf(config)),
      inject: [ConfigService],
    },
    {
      provide: ClockPort,
      useFactory: (config: ConfigService) => new SystemClock(config.get<string>('APP_TIMEZONE') || undefined),
      inject: [ConfigService],
    },
    {
      provide: LoginThrottle,
      useFactory: (clients: PrismaClientProvider, clock: ClockPort, config: ConfigService) =>
        new PrismaLoginThrottle(clients, clock, loginLockTiers(readerOf(config))),
      inject: [PrismaClientProvider, ClockPort, ConfigService],
    },
    {
      provide: RefreshCookieOptions,
      useFactory: (config: ConfigService) => RefreshCookieOptions.fromEnv(readerOf(config)),
      inject: [ConfigService],
    },
  ],
})
export class IdentityModule {}
