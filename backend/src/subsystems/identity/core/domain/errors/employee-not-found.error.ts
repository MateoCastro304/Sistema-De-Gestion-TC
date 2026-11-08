import { DomainError } from '../../../../../shared/domain/errors/domain.error';

export class EmployeeNotFound extends DomainError {
  constructor(public readonly id: number) {
    super('No se encontró el empleado solicitado.');
  }
}
