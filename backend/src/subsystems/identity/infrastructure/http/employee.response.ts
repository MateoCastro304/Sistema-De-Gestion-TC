import { Employee } from '../../core/domain/entities/employee.entity';
import { EmployeeListResult } from '../../core/domain/ports/employee.repository';
import { EmployeePosition } from '../../core/domain/value-objects/employee-position.vo';
import { EmployeeUser } from '../../core/domain/value-objects/employee-user.vo';

/** Forma del recurso empleado según el contrato (§3.2). `createdByUserId` no se expone (D-43). */
export type EmployeeResponseBody = {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  position: EmployeePosition;
  address: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  user: EmployeeUser | null;
  createdAt: string;
  updatedAt: string;
};

export class EmployeeResponse {
  static from(employee: Employee): EmployeeResponseBody {
    const user = employee.getUser();
    return {
      id: employee.getId()!,
      firstName: employee.getFirstName(),
      lastName: employee.getLastName(),
      dni: employee.getDni(),
      position: employee.getPosition(),
      address: employee.getAddress(),
      email: employee.getEmail(),
      phone: employee.getPhone(),
      active: employee.isActive(),
      // Copia de roles: la respuesta no comparte el array de la entidad.
      user: user ? { ...user, roles: [...user.roles] } : null,
      createdAt: employee.getCreatedAt().toISOString(),
      updatedAt: employee.getUpdatedAt().toISOString(),
    };
  }
}

/** Sobre de GET /employees: la página, el total del filtro y page/limit ya resueltos. */
export type EmployeeListResponseBody = {
  items: EmployeeResponseBody[];
  total: number;
  page: number;
  limit: number;
};

export class EmployeeListResponse {
  static from(result: EmployeeListResult, page: number, limit: number): EmployeeListResponseBody {
    return {
      items: result.items.map((employee) => EmployeeResponse.from(employee)),
      total: result.total,
      page,
      limit,
    };
  }
}
