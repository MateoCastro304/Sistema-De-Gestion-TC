import { UserDomainError } from './user-domain.error';

/**
 * `field` identifica qué campo del body la violó (username, password o
 * roles) — lo necesita el filtro HTTP para armar el `details: [{field,
 * message}]` que pide el contrato, sin tener que adivinar a partir del
 * texto del mensaje.
 */
export class UserValidationError extends UserDomainError {
  constructor(
    message: string,
    public readonly field: 'username' | 'password' | 'roles',
  ) {
    super(message);
  }
}
