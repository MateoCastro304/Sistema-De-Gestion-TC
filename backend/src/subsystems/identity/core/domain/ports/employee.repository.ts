import { Employee } from '../entities/employee.entity';

export type EmployeeListParams = {
  page: number;
  limit: number;
  search?: string;
  includeInactive: boolean;
  hasUser?: boolean;
};

export type EmployeeListResult = {
  items: Employee[];
  total: number;
};


export abstract class EmployeeRepository {

  abstract findById(id: number): Promise<Employee | null>;

  abstract findByIds(ids: number[]): Promise<Employee[]>;

  abstract existsByDni(dni: string): Promise<boolean>;


  abstract list(params: EmployeeListParams): Promise<EmployeeListResult>;

  abstract save(employee: Employee): Promise<Employee>;
}
