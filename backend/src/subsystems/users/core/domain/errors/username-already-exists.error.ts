import { UserDomainError } from './user-domain.error';

/**
 * CU-05 Escenario 3. El nombre de usuario es único en todo el sistema,
 * activo o dado de baja (no se reutiliza). Mapeado a 409 USERNAME_TAKEN.
 */
export class UsernameAlreadyExists extends UserDomainError {
  constructor(public readonly username: string) {
    super('El nombre de usuario ya está en uso');
  }
}
