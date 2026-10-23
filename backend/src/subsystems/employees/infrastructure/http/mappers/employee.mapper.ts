import { Employee } from '../../../core/domain/entities/employee';
import { EmployeePosition } from '../../../core/domain/value-objects/employee-position';
import { EmployeeUser } from '../../../core/domain/value-objects/employee-user';

export type EmployeeResponse = {
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

export type EmployeeListResponse = {
  items: EmployeeResponse[];
  total: number;
  page: number;
  limit: number;
};

export function toEmployeeResponse(employee: Employee): EmployeeResponse {
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
