import { Injectable } from '@nestjs/common';
import { ClockPort } from '../../../../../shared/clock/clock.port';
import type { AuthenticatedUser } from '../../../../../shared/domain/authenticated-user';
import { Unauthenticated } from '../../domain/errors/unauthenticated.error';
import { SessionPolicy } from '../../domain/ports/session-policy.port';
import { SessionRepository } from '../../domain/ports/session.repository';
import { TokenIssuer } from '../../domain/ports/token-issuer.port';
import { UserAuthRepository } from '../../domain/ports/user-auth.repository';
import { assertSessionUsable } from '../assert-session-usable';

/** Entrada de {@link AuthenticateRequest}: lo que el guard saca de la petición. */
export type AuthenticateRequestCommand = {
  /** El access token del encabezado `Authorization: Bearer`; `undefined` si no llegó. */
  accessToken: string | undefined;
};

/**
 * Autentica **cada petición** (D-04). El access token solo no alcanza: se
 * verifica además que su sesión del servidor siga abierta y que el usuario siga
 * pudiendo ingresar, así cerrar la sesión o dar de baja al usuario corta el
 * acceso aunque el token todavía no haya vencido.
 *
 * Los roles y permisos se leen de la base en cada petición y no del token, para
 * que un cambio de roles rija desde la petición siguiente (RNF09).
 *
 * La actividad se registra como mucho una vez por intervalo (cada UPDATE crea una
 * versión nueva de la fila), y es lo que mantiene viva la sesión: el refresh no
 * cuenta (D-46).
 *
 * Un bloqueo de ingreso **no** corta las sesiones abiertas: es temporal y se
 * cuenta por usuario, así que cortarlas dejaría a cualquiera dejar afuera a un
 * usuario ajeno con solo fallar ingresos contra su nombre.
 *
 * @throws `AccessTokenExpired` si el token venció: el cliente renueva y repite.
 * @throws `SessionExpired` si la sesión venció por duración o inactividad.
 * @throws `Unauthenticated` en cualquier otro caso.
 */
@Injectable()
export class AuthenticateRequest {
  constructor(
    private readonly users: UserAuthRepository,
    private readonly sessions: SessionRepository,
    private readonly tokens: TokenIssuer,
    private readonly policy: SessionPolicy,
    private readonly clock: ClockPort,
  ) {}

  async execute(command: AuthenticateRequestCommand): Promise<AuthenticatedUser> {
    if (!command.accessToken) throw new Unauthenticated();

    const claims = this.tokens.verify(command.accessToken);

    const session = await this.sessions.findById(claims.sid);
    // El token tiene que apuntar a una sesión de su propio usuario.
    if (!session || session.getUserId() !== claims.sub) throw new Unauthenticated();

    const now = this.clock.now();
    await assertSessionUsable(this.sessions, this.policy, session, now);

    const user = await this.users.findById(claims.sub);
    if (!user || !user.isActive()) {
      await this.sessions.end(session.getId(), 'REVOKED', now);
      throw new Unauthenticated();
    }

    if (session.needsActivityUpdate(now, this.policy.activityWriteIntervalSeconds)) {
      await this.sessions.touchActivity(session.getId(), now);
    }

    return {
      userId: user.getId(),
      sessionId: session.getId(),
      roles: user.getRoles(),
      permissions: user.getPermissions(),
    };
  }
}
