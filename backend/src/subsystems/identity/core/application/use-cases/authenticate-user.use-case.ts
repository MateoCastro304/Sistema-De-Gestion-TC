import { Injectable, OnModuleInit } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { ClockPort } from '../../../../../shared/clock/clock.port';
import { AuthUser } from '../../domain/entities/auth-user.entity';
import { InvalidCredentials } from '../../domain/errors/invalid-credentials.error';
import { UserBlocked } from '../../domain/errors/user-blocked.error';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { LoginAttemptContext, LoginThrottle } from '../../domain/ports/login-throttle.port';
import { SessionPolicy } from '../../domain/ports/session-policy.port';
import { SessionRepository } from '../../domain/ports/session.repository';
import { TokenIssuer } from '../../domain/ports/token-issuer.port';
import { UserAuthRepository } from '../../domain/ports/user-auth.repository';
import { generateRefreshToken } from '../../domain/refresh-token-secret';
import { AuthenticatedSession, toAuthenticatedSession } from '../authenticated-session';

export type AuthenticateUserCommand = {
  username: string;
  password: string;
  /** IP de quien llama. Solo sirve de clave del bloqueo por usuario+IP. */
  ip: string;
};

/**
 * Inicio de sesión (CU-53). Un usuario inexistente, una contraseña incorrecta y un
 * usuario dado de baja dan el mismo `InvalidCredentials`, y los tres cuentan como
 * intento fallido: si solo contaran los usuarios que existen, el bloqueo
 * revelaría cuáles son.
 *
 * El bloqueo se consulta **antes** de verificar la contraseña: bcrypt cuesta unos
 * cientos de milisegundos de CPU, y gastarlos con alguien que ya está bloqueado
 * es justo el trabajo que un atacante quiere que haga el servidor.
 *
 * El intento que alcanza el umbral responde `UserBlocked` en lugar de
 * `InvalidCredentials`: decirle de inmediato que la cuenta se cerró es cierto y
 * accionable, y evita que parezcan dos problemas distintos.
 */
@Injectable()
export class AuthenticateUser implements OnModuleInit {
  /**
   * Hash de una contraseña que nadie usa. Cuando el usuario no existe se verifica
   * contra este hash para gastar el mismo tiempo que con un usuario real: si no, la
   * demora de la respuesta revelaría qué usernames existen. Lo genera el mismo
   * hasher que guarda las contraseñas, así su costo (`BCRYPT_COST`) coincide siempre
   * con el de los usuarios reales; un hash fijo solo serviría con un costo.
   */
  private timingEqualizerHash: Promise<string> | undefined;

  constructor(
    private readonly users: UserAuthRepository,
    private readonly sessions: SessionRepository,
    private readonly hasher: PasswordHasher,
    private readonly tokens: TokenIssuer,
    private readonly throttle: LoginThrottle,
    private readonly policy: SessionPolicy,
    private readonly clock: ClockPort,
  ) {}

  /** Lo prepara al arrancar la aplicación, para que ningún ingreso pague ese hash de más. */
  async onModuleInit(): Promise<void> {
    await this.equalizerHash();
  }

  async execute(command: AuthenticateUserCommand): Promise<AuthenticatedSession> {
    const attempt: LoginAttemptContext = { username: command.username.trim().toLowerCase(), ip: command.ip };

    const waitSeconds = await this.throttle.remainingLockSeconds(attempt);
    if (waitSeconds > 0) throw new UserBlocked(waitSeconds);

    const user = await this.users.findByUsername(attempt.username);
    const passwordOk = user
      ? await this.hasher.verify(command.password, user.getPasswordHash())
      : await this.equalizeTiming(command.password);

    if (!user || !passwordOk || !user.isActive()) throw await this.failAttempt(attempt);

    // Las credenciales eran correctas: se limpia acá y no al final, porque lo que
    // sigue puede fallar por un problema de datos y un 500 no es motivo para
    // cargarle fallos a quien escribió bien su contraseña.
    await this.throttle.recordSuccess(attempt);

    return this.openSession(user);
  }

  private async openSession(user: AuthUser): Promise<AuthenticatedSession> {
    const now = this.clock.now();
    const refresh = generateRefreshToken();

    const session = await this.sessions.open({
      userId: user.getId(),
      refreshTokenHash: refresh.hash,
      now,
      expiresAt: new Date(now.getTime() + this.policy.maxLifetimeSeconds * 1000),
    });
    const access = this.tokens.issue({ sub: user.getId(), sid: session.getId() });

    return toAuthenticatedSession({ user, session, access, refreshToken: refresh.token, policy: this.policy });
  }

  /** Verifica contra un hash descartable y devuelve siempre `false`. */
  private async equalizeTiming(password: string): Promise<false> {
    await this.hasher.verify(password, await this.equalizerHash());
    return false;
  }

  private equalizerHash(): Promise<string> {
    this.timingEqualizerHash ??= this.hasher.hash(randomUUID());
    return this.timingEqualizerHash;
  }

  /**
   * Cuenta el intento fallido y devuelve el error a lanzar, sin lanzarlo: así cada
   * llamada se lee `throw await this.failAttempt(...)` y el `throw` queda visible.
   */
  private async failAttempt(attempt: LoginAttemptContext): Promise<InvalidCredentials | UserBlocked> {
    const waitSeconds = await this.throttle.recordFailure(attempt);
    return waitSeconds > 0 ? new UserBlocked(waitSeconds) : new InvalidCredentials();
  }
}
