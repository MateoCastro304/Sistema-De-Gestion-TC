import { DomainError } from '../../../../../shared/domain/errors/domain.error';

export class InvalidEmployeeId extends DomainError {
  constructor() {
    super('El identificador del empleado no es válido.');
  }
}
