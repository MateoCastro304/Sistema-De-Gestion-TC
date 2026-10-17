import { UserDomainError } from './user-domain.error';

/** GetUserById. Mapeado a 404 USER_NOT_FOUND. */
export class UserNotFound extends UserDomainError {
  constructor(public readonly id: number) {
    super('No se encontró el usuario solicitado.');
  }
}
