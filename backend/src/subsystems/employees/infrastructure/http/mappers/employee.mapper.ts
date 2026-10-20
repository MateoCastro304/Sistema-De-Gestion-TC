import { Employee } from '../../../core/domain/entities/employee';
import { EmployeePosition } from '../../../core/domain/value-objects/employee-position';


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
    createdAt: employee.getCreatedAt().toISOString(),
    updatedAt: employee.getUpdatedAt().toISOString(),
  };
}
