import { DomainError } from '../../../../../shared/domain/errors/domain.error';

/**
 * El usuario que firma el cambio no existe. Provisorio: cuando exista la
 * sesión (identity), el usuario siempre será válido y este error desaparece.
 */
export class ChangeAuthorUnknown extends DomainError {
  readonly code = 'UNAUTHENTICATED';

  constructor() {
    super('La autenticación es requerida.');
  }
}
