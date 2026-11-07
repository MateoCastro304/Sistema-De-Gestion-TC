import { Injectable } from '@nestjs/common';
import { TextKey } from '../../../../../shared/domain/text-key';
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

/** Misma regla que el adaptador Prisma: nombre y apellido, DNI o rótulo del puesto. */
function matches(employee: Employee, search: string | undefined): boolean {
  const key = search ? TextKey.create(search).getValue() : '';
  if (!key) return true;

  return (
    TextKey.create(`${employee.getFirstName()} ${employee.getLastName()}`).getValue().includes(key) ||
    employee.getDni().includes(key) ||
    TextKey.create(EMPLOYEE_POSITION_LABELS[employee.getPosition()]).getValue().includes(key)
  );
}

/**
 * Implementación en memoria del puerto EmployeeRepository. Replica la semántica
 * del adaptador Prisma — DNI único entre todos (activos e inactivos), búsqueda
 * sin mayúsculas ni acentos, orden por apellido y nombre, total sobre el
 * conjunto filtrado — para que los specs de los casos de uso se comporten igual.
 * Solo la usan los specs como fake.
 */
@Injectable()
export class InMemoryEmployeeRepository implements EmployeeRepository {
  private items: Employee[] = [];
  private nextId: number = 1;

  async findById(id: number): Promise<Employee | null> {
    return this.items.find((e) => e.getId() === id) ?? null;
  }

  async findByIds(ids: number[]): Promise<Employee[]> {
    return this.items.filter((e) => ids.includes(e.getId()!));
  }

  async existsByDni(dni: string): Promise<boolean> {
    return this.items.some((e) => e.getDni() === dni);
  }

  async list(params: EmployeeListParams): Promise<EmployeeListResult> {
    const filtered = this.items
      .filter((e) => params.includeInactive || e.isActive())
      .filter((e) => params.hasUser === undefined || (e.getUser() !== null) === params.hasUser)
      .filter((e) => matches(e, params.search))
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

  /** Carga un empleado ya dado de baja (no hay endpoint de baja en este sprint). Solo para tests. */
  seedInactive(employee: Employee): Employee {
    const stored = Employee.reconstruct({ ...snapshotOf(employee), id: this.nextId++, active: false });
    this.items.push(stored);
    return stored;
  }

  /** Le asigna un usuario a un empleado ya guardado (en la base lo hace users). Solo para tests. */
  attachUser(employeeId: number, user: EmployeeUser): Employee {
    const index = this.items.findIndex((e) => e.getId() === employeeId);
    if (index === -1) {
      throw new Error(`Employee ${employeeId} not found in memory`);
    }
    const updated = Employee.reconstruct({ ...snapshotOf(this.items[index]), id: employeeId, user });
    this.items[index] = updated;
    return updated;
  }

  /** Total de empleados guardados. Los tests lo usan para verificar efectos. */
  count(): number {
    return this.items.length;
  }
}
