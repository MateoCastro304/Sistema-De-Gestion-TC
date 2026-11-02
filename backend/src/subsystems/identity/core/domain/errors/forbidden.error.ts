import { DomainError } from '../../../../../shared/domain/errors/domain.error';

/** El usuario tiene sesión pero ninguno de sus roles permite la operación (RNF09). */
export class Forbidden extends DomainError {
  readonly code = 'FORBIDDEN';

  constructor() {
    super('No tenés permisos para realizar esta operación.');
  }
}
