import { Employee } from '../../core/domain/entities/employee.entity';
import { User } from '../../core/domain/entities/user.entity';
import { UserListResult } from '../../core/domain/ports/user.repository';
import { Role } from '../../core/domain/value-objects/role.vo';
import { UserStatus } from '../../core/domain/value-objects/user-status.vo';

/** Forma del recurso usuario según el contrato (§3.3). Nunca incluye la contraseña (RNF08). */
export type UserResponseBody = {
  id: number;
  username: string;
  employee: { id: number; firstName: string; lastName: string };
  roles: Role[];
  status: UserStatus;
  lastAccessAt: string | null;
  createdAt: string;
};

/**
 * Serializa un User junto con su empleado, que no vive en la entidad: lo
 * resuelve EmployeeRepository. User no expone un getter que entregue el hash
 * fuera de getPasswordHash(), y esta clase ni lo toca.
 */
export class UserResponse {
  static from(user: User, employee: Employee): UserResponseBody {
    return {
      id: user.getId()!,
      username: user.getUsername(),
      employee: { id: employee.getId()!, firstName: employee.getFirstName(), lastName: employee.getLastName() },
      roles: user.getRoles(),
      status: user.getStatus(),
      lastAccessAt: user.getLastAccessAt()?.toISOString() ?? null,
      createdAt: user.getCreatedAt().toISOString(),
    };
  }
}

/** Sobre de GET /users: la página, el total del filtro y page/limit ya resueltos. */
export type UserListResponseBody = {
  items: UserResponseBody[];
  total: number;
  page: number;
  limit: number;
};

export class UserListResponse {
  /** `employees` son los de los usuarios de la página, ya resueltos en una sola consulta. */
  static from(result: UserListResult, employees: Employee[], page: number, limit: number): UserListResponseBody {
    const employeeById = new Map(employees.map((employee) => [employee.getId(), employee]));
    return {
      items: result.items.map((user) => UserResponse.from(user, employeeById.get(user.getEmployeeId())!)),
      total: result.total,
      page,
      limit,
    };
  }
}
