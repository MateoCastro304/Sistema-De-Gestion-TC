import { DomainError } from '../../../../../shared/domain/errors/domain.error';

export class EmployeeDniTaken extends DomainError {
  constructor(public readonly dni: string) {
    super('Ya existe un empleado con ese DNI');
  }
}
