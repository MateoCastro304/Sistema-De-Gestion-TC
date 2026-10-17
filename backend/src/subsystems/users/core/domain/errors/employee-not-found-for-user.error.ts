import { UserDomainError } from './user-domain.error';

/**
 * CU-05 (D-21). El employeeId no corresponde a ningún empleado registrado.
 * Mapeado a 400 VALIDATION_ERROR, con detail sobre el campo "employeeId" —
 * distinto del 422 por empleado inactivo.
 */
export class EmployeeNotFoundForUser extends UserDomainError {
  constructor(public readonly employeeId: number) {
    super('No existe un empleado con ese identificador.');
  }
}
