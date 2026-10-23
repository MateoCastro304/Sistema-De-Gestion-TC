import { Injectable } from '@nestjs/common';
import { matchesSearch } from '../../../../../shared/domain/search-text';
import { Employee, EmployeeSnapshot } from '../../../core/domain/entities/employee';
import {
  EmployeeListParams,
  EmployeeListResult,
  EmployeeRepository,
} from '../../../core/domain/ports/employee.repository';
import { EMPLOYEE_POSITION_LABELS } from '../../../core/domain/value-objects/employee-position';
import { EmployeeUser } from '../../../core/domain/value-objects/employee-user';

const collator = new Intl.Collator('es', { sensitivity: 'base' });

function snapshotOf(employee: Employee): Omit<EmployeeSnapshot, 'id'> {
  return {
    firstName: employee.getFirstName(),
    lastName: employee.getLastName(),
    dni: employee.getDni(),
    position: employee.getPosition(),
    address: employee.getAddress(),
    email: employee.getEmail(),
    phone: employee.getPhone(),
    active: employee.isActive(),
    createdAt: employee.getCreatedAt(),
    updatedAt: employee.getUpdatedAt(),
    user: employee.getUser(),
  };
}

@Injectable()
export class InMemoryEmployeeRepository implements EmployeeRepository {
  private items: Employee[] = [];
  private nextId: number = 1;

  async findById(id: number): Promise<Employee | null> {
    return this.items.find((e) => e.getId() === id) ?? null;
  }

  async existsByDni(dni: string): Promise<boolean> {
    return this.items.some((e) => e.getDni() === dni);
  }

  async list(params: EmployeeListParams): Promise<EmployeeListResult> {
    const filtered = this.items
      .filter((e) => params.includeInactive || e.isActive())
      .filter((e) => params.hasUser === undefined || (e.getUser() !== null) === params.hasUser)
      .filter((e) =>
        matchesSearch(params.search, [
          e.getFirstName(),
          e.getLastName(),
          e.getDni(),
          EMPLOYEE_POSITION_LABELS[e.getPosition()],
        ]),
      )
      .sort(
        (a, b) =>
          collator.compare(a.getLastName(), b.getLastName()) ||
          collator.compare(a.getFirstName(), b.getFirstName()) ||
          a.getId()! - b.getId()!,
      );

    const start = (params.page - 1) * params.limit;
    return { items: filtered.slice(start, start + params.limit), total: filtered.length };
  }

  async save(employee: Employee): Promise<Employee> {
    const stored = Employee.reconstruct({ ...snapshotOf(employee), id: this.nextId++ });
    this.items.push(stored);
    return stored;
  }

  seedInactive(employee: Employee): Employee {
    const stored = Employee.reconstruct({ ...snapshotOf(employee), id: this.nextId++, active: false });
    this.items.push(stored);
    return stored;
  }

  attachUser(employeeId: number, user: EmployeeUser): Employee {
    const index = this.items.findIndex((e) => e.getId() === employeeId);
    if (index === -1) {
      throw new Error(`Employee ${employeeId} not found in memory`);
    }
    const updated = Employee.reconstruct({ ...snapshotOf(this.items[index]), id: employeeId, user });
    this.items[index] = updated;
    return updated;
  }

  count(): number {
    return this.items.length;
  }
}
