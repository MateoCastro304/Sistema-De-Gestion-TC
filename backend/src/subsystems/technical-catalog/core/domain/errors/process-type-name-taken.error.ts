import { DomainError } from '../../../../../shared/domain/errors/domain.error';

export class ProcessTypeNameTaken extends DomainError {
  readonly code = 'PROCESS_TYPE_NAME_TAKEN';

  constructor() {
    super('Ya existe un tipo de proceso con ese nombre');
  }
}
