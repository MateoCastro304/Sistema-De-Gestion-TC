import { DomainError } from '../../../../../shared/domain/errors/domain.error';

export class ProcessTypeNotFound extends DomainError {
  readonly code = 'PROCESS_TYPE_NOT_FOUND';

  constructor() {
    super('No se encontró el tipo de proceso solicitado.');
  }
}
