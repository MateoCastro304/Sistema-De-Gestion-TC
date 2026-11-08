import { DomainError } from '../../../../../shared/domain/errors/domain.error';

/** GetUserById. Mapeado a 404 USER_NOT_FOUND. */
export class UserNotFound extends DomainError {
  constructor(public readonly id: number) {
    super('No se encontró el usuario solicitado.');
  }
}
