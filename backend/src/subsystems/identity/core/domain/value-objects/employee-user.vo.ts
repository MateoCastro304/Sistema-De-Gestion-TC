import { UserStatus } from './user-status.vo';

/**
 * Resumen del usuario de un empleado (§3.2, campo `user`). Es de solo lectura:
 * sirve para mostrar el usuario junto al empleado. Los roles son sus códigos
 * (`JT`, `AS`, …), en el orden del prototipo.
 */
export type EmployeeUser = {
  id: number;
  username: string;
  roles: string[];
  status: UserStatus;
};
