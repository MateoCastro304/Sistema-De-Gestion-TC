import { User } from '../../../core/domain/entities/user';
import { Role } from '../../../core/domain/value-objects/role';
import { UserStatus } from '../../../core/domain/entities/user';
import { EmployeeSummary } from '../../../core/domain/ports/employee-query.port';

export type UserResponse = {
  id: number;
  username: string;
  employee: { id: number; firstName: string; lastName: string };
  roles: Role[];
  status: UserStatus;
  lastAccessAt: string | null;
  createdAt: string;
};

/**
 * Envelope de GET /users: la página de items junto con el total, igual que
 * /categories, /factories y /suppliers.
 */
export type UserListResponse = {
  items: UserResponse[];
  total: number;
  page: number;
  limit: number;
};

/**
 * Serializa un User junto con el resumen de su empleado (que no vive en la
 * entidad: lo resuelve EmployeeQuery). Nunca incluye passwordHash — User no
 * expone un getter que lo entregue fuera de getPasswordHash(), y este mapper
 * ni lo toca.
 */
export function toUserResponse(user: User, employee: EmployeeSummary): UserResponse {
  return {
    id: user.getId() as number,
    username: user.getUsername(),
    employee: { id: employee.id, firstName: employee.firstName, lastName: employee.lastName },
    roles: user.getRoles(),
    status: user.getStatus(),
    lastAccessAt: user.getLastAccessAt()?.toISOString() ?? null,
    createdAt: user.getCreatedAt().toISOString(),
  };
}
