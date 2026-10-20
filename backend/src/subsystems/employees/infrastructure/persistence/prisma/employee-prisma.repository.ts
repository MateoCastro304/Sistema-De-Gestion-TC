import { Injectable } from '@nestjs/common';
import { Prisma, Employee as EmployeeRow } from '../../../../../generated/prisma/client';
import { matchesSearch } from '../../../../../shared/domain/search-text';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { Employee } from '../../../core/domain/entities/employee';
import { EmployeeDniTaken } from '../../../core/domain/errors/employee-dni-taken.error';
import {
  EmployeeListParams,
  EmployeeListResult,
  EmployeeRepository,
} from '../../../core/domain/ports/employee.repository';
import { EMPLOYEE_POSITION_LABELS } from '../../../core/domain/value-objects/employee-position';

const collator = new Intl.Collator('es', { sensitivity: 'base' });


@Injectable()
export class EmployeePrismaRepository implements EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Employee | null> {
    const row = await this.prisma.employee.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async existsByDni(dni: string): Promise<boolean> {
    const count = await this.prisma.employee.count({ where: { dni } });
    return count > 0;
  }

  async list(params: EmployeeListParams): Promise<EmployeeListResult> {
    const rows = await this.prisma.employee.findMany({
      where: params.includeInactive ? {} : { isActive: true },
    });

    const matching = rows.filter((row) =>
      matchesSearch(params.search, [row.firstName, row.lastName, row.dni, EMPLOYEE_POSITION_LABELS[row.position]]),
    );

    // Por apellido y nombre; el id desempata para que el orden sea siempre el mismo.
    matching.sort(
      (a, b) => collator.compare(a.lastName, b.lastName) || collator.compare(a.firstName, b.firstName) || a.id - b.id,
    );

    const start = (params.page - 1) * params.limit;
    const items = matching.slice(start, start + params.limit).map((row) => this.toDomain(row));

    return { items, total: matching.length };
  }

  async save(employee: Employee): Promise<Employee> {
    try {
      const row = await this.prisma.employee.create({
        data: {
          firstName: employee.getFirstName(),
          lastName: employee.getLastName(),
          dni: employee.getDni(),
          position: employee.getPosition(),
          address: employee.getAddress(),
          email: employee.getEmail(),
          phone: employee.getPhone(),
          isActive: employee.isActive(),
        },
      });
      return this.toDomain(row);
    } catch (error) {

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new EmployeeDniTaken(employee.getDni());
      }
      throw error;
    }
  }

  private toDomain(row: EmployeeRow): Employee {
    return Employee.reconstruct({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      dni: row.dni,
      position: row.position,
      address: row.address,
      email: row.email,
      phone: row.phone,
      active: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
