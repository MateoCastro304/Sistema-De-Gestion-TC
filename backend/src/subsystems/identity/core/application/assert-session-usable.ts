import { Session } from '../domain/entities/session.entity';
import { SessionExpired } from '../domain/errors/session-expired.error';
import { Unauthenticated } from '../domain/errors/unauthenticated.error';
import { SessionPolicy } from '../domain/ports/session-policy.port';
import { SessionRepository } from '../domain/ports/session.repository';

/**
 * Una sesión cerrada, vencida o inactiva no sirve ni para renovar ni para operar.
 * Si el vencimiento se detecta recién ahora, se la cierra con su motivo: no hace
 * falta un proceso programado para que la regla se cumpla.
 *
 * @throws `Unauthenticated` si ya estaba cerrada.
 * @throws `SessionExpired` si venció por duración o por inactividad.
 */
export async function assertSessionUsable(
  sessions: SessionRepository,
  policy: SessionPolicy,
  session: Session,
  now: Date,
): Promise<void> {
  const state = session.check(now, policy.inactivitySeconds);

  if (state === 'ENDED') throw new Unauthenticated();
  if (state === 'EXPIRED') {
    await sessions.end(session.getId(), 'EXPIRED', now);
    throw new SessionExpired('EXPIRED');
  }
  if (state === 'INACTIVE') {
    await sessions.end(session.getId(), 'INACTIVITY', now);
    throw new SessionExpired('INACTIVITY');
  }
}
