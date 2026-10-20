import { Employee } from '../entities/employee';

export type EmployeeListParams = {
  page: number;
  limit: number;
  search?: string;
  includeInactive: boolean;
};

export type EmployeeListResult = {
  items: Employee[];
  total: number;
};


export abstract class EmployeeRepository {

  abstract findById(id: number): Promise<Employee | null>;

  abstract existsByDni(dni: string): Promise<boolean>;


  abstract list(params: EmployeeListParams): Promise<EmployeeListResult>;

  abstract save(employee: Employee): Promise<Employee>;
}
