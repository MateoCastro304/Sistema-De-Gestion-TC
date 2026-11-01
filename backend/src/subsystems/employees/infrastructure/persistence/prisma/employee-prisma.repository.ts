import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { matchesSearch } from '../../../../../shared/domain/search-text';
import { computeUserStatus } from '../../../../../shared/domain/user-status';
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

// Solo los datos del usuario que forman el resumen `user`. Nunca el hash de la contraseña.
const USER_SUMMARY = {
  user: { select: { id: true, username: true, roles: true, isActive: true, isBlocked: true } },
} satisfies Prisma.EmployeeInclude;

type EmployeeRow = Prisma.EmployeeGetPayload<{ include: typeof USER_SUMMARY }>;

@Injectable()
export class EmployeePrismaRepository implements EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Employee | null> {
    const row = await this.prisma.employee.findUnique({ where: { id }, include: USER_SUMMARY });
    return row ? this.toDomain(row) : null;
  }

  async existsByDni(dni: string): Promise<boolean> {
    const count = await this.prisma.employee.count({ where: { dni } });
    return count > 0;
  }

  async list(params: EmployeeListParams): Promise<EmployeeListResult> {
    const rows = await this.prisma.employee.findMany({
      where: {
        ...(params.includeInactive ? {} : { isActive: true }),
        ...(params.hasUser === undefined ? {} : { user: params.hasUser ? { isNot: null } : { is: null } }),
      },
      include: USER_SUMMARY,
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
        include: USER_SUMMARY,
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
      user: row.user
        ? {
            id: row.user.id,
            username: row.user.username,
            roles: row.user.roles,
            status: computeUserStatus({ active: row.user.isActive, blocked: row.user.isBlocked }),
          }
        : null,
    });
  }
}
