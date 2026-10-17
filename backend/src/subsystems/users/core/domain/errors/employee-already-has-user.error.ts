import { UserDomainError } from './user-domain.error';

/**
 * CU-05 Escenario 4. Cada empleado puede tener como máximo un usuario.
 * Lleva el id y el username del usuario existente para que el cliente
 * pueda ofrecer "consultarlo o modificarlo". Mapeado a 409
 * EMPLOYEE_ALREADY_HAS_USER.
 */
export class EmployeeAlreadyHasUser extends UserDomainError {
  constructor(
    public readonly employeeId: number,
    public readonly existingUserId: number,
    public readonly existingUsername: string,
  ) {
    super(`Este empleado ya tiene el usuario «${existingUsername}»`);
  }
}
