import { UserDomainError } from './user-domain.error';

/**
 * CU-05 (D-21). Un usuario corresponde a un empleado activo. Mapeado a
 * 422 EMPLOYEE_INACTIVE — distinto del 400 por empleado inexistente.
 */
export class EmployeeInactive extends UserDomainError {
  constructor(public readonly employeeId: number) {
    super('El empleado está dado de baja: no se le puede crear un usuario.');
  }
}
