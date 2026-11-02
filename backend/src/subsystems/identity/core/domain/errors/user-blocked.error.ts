import { DomainError } from '../../../../../shared/domain/errors/domain.error';

/**
 * El ingreso está bloqueado por intentos fallidos. El bloqueo es temporal: el
 * cliente recibe cuánto esperar (`retryAfterSeconds`, también como `Retry-After`).
 */
export class UserBlocked extends DomainError {
  readonly code = 'USER_BLOCKED';

  constructor(readonly retryAfterSeconds: number) {
    super('Demasiados intentos fallidos. Esperá antes de volver a intentar.');
  }
}
