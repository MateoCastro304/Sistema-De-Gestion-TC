import { DomainError } from '../../../../../shared/domain/errors/domain.error';

/** Otro pedido modificó el mismo tipo de proceso una y otra vez mientras se intentaba guardar el cambio. */
export class ProcessTypeConcurrentModification extends DomainError {
  readonly code = 'INTERNAL_SERVER_ERROR';

  constructor() {
    super('No se pudo guardar el cambio por modificaciones simultáneas. Intentá de nuevo.');
  }
}
