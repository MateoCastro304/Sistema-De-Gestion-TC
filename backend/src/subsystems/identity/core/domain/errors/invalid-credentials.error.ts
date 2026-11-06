import { DomainError } from '../../../../../shared/domain/errors/domain.error';

/**
 * Usuario inexistente, contraseña incorrecta o usuario dado de baja. Los tres
 * casos tienen el mismo mensaje a propósito: el cliente no puede averiguar cuál
 * fue (OWASP).
 */
export class InvalidCredentials extends DomainError {
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Usuario o contraseña incorrectos');
  }
}
