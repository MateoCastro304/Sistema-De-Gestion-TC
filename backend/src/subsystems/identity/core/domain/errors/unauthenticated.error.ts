import { DomainError } from '../../../../../shared/domain/errors/domain.error';

/** No hay sesión válida: falta el token, es inválido o su sesión está cerrada. */
export class Unauthenticated extends DomainError {
  readonly code = 'UNAUTHENTICATED';

  constructor() {
    super('La autenticación es requerida.');
  }
}
