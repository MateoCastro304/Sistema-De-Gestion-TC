import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { TextKey } from '../../../../../shared/domain/text-key';
import { computeUserStatus } from '../../../../../shared/domain/user-status';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { Employee } from '../../../core/domain/entities/employee';
import { EmployeeDniTaken } from '../../../core/domain/errors/employee-dni-taken.error';
import {
  EmployeeListParams,
  EmployeeListResult,
  EmployeeRepository,
} from '../../../core/domain/ports/employee.repository';
import { EMPLOYEE_POSITIONS, EMPLOYEE_POSITION_LABELS } from '../../../core/domain/value-objects/employee-position';

// Solo los datos del usuario que forman el resumen `user`. Nunca el hash de la contraseña.
// Los roles salen en el orden del enum (el de la tabla `Role` del contrato).
const USER_SUMMARY = {
  user: {
    select: {
      id: true,
      username: true,
      isActive: true,
      blockedAt: true,
      roles: { select: { role: true }, orderBy: { role: 'asc' } },
    },
  },
} satisfies Prisma.EmployeeInclude;

type EmployeeRow = Prisma.EmployeeGetPayload<{ include: typeof USER_SUMMARY }>;

/**
 * Adaptador Prisma del puerto EmployeeRepository (tabla `employee`).
 *
 * La búsqueda sigue el diseño de la base (docs/database/cambios-bdd-sprint2.md §10):
 * `search_key` guarda nombre y apellido normalizados, la aplicación lo calcula al
 * escribir y normaliza el texto buscado con el mismo TextKey.
 */
@Injectable()
export class EmployeePrismaRepository implements EmployeeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<Employee | null> {
    const row = await this.prisma.employee.findUnique({ where: { id }, include: USER_SUMMARY });
    return row ? this.toDomain(row) : null;
  }

  async findByIds(ids: number[]): Promise<Employee[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];

    const rows = await this.prisma.employee.findMany({ where: { id: { in: unique } }, include: USER_SUMMARY });
    return rows.map((row) => this.toDomain(row));
  }

  async existsByDni(dni: string): Promise<boolean> {
    const count = await this.prisma.employee.count({ where: { dni } });
    return count > 0;
  }

  async list(params: EmployeeListParams): Promise<EmployeeListResult> {
    const where: Prisma.EmployeeWhereInput = {
      ...(params.includeInactive ? {} : { isActive: true }),
      ...(params.hasUser === undefined ? {} : { user: params.hasUser ? { isNot: null } : { is: null } }),
      ...EmployeePrismaRepository.searchFilter(params.search),
    };

    // Una sola transacción: la página y el total salen del mismo estado de la base.
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.employee.findMany({
        where,
        include: USER_SUMMARY,
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }, { id: 'asc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return { items: rows.map((row) => this.toDomain(row)), total };
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
          // Columna normalizada que calcula la aplicación (la base no puede quitar acentos).
          searchKey: TextKey.create(`${employee.getFirstName()} ${employee.getLastName()}`).getValue(),
          isActive: employee.isActive(),
        },
        include: USER_SUMMARY,
      });
      return this.toDomain(row);
    } catch (error) {
      // Entre existsByDni y este INSERT hay una ventana: dos altas simultáneas con el
      // mismo DNI pasan el chequeo y una la rechaza la base. La única restricción
      // única de la tabla (además del id) es el DNI, así que cualquier P2002 es eso.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new EmployeeDniTaken(employee.getDni());
      }
      throw error;
    }
  }

  /**
   * `search` coincide si el texto normalizado está en nombre y apellido
   * (`search_key`), en el DNI o en el rótulo del puesto ("Jefe de taller").
   * El rótulo no está en la base: se buscan los puestos cuyo rótulo lo contiene.
   */
  private static searchFilter(search: string | undefined): Prisma.EmployeeWhereInput {
    const key = search ? TextKey.create(search).getValue() : '';
    if (!key) return {};

    const positions = EMPLOYEE_POSITIONS.filter((position) =>
      TextKey.create(EMPLOYEE_POSITION_LABELS[position]).getValue().includes(key),
    );

    return {
      OR: [
        { searchKey: { contains: key } },
        { dni: { contains: key } },
        ...(positions.length > 0 ? [{ position: { in: positions } }] : []),
      ],
    };
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
            roles: row.user.roles.map((r) => r.role),
            // D-26: un usuario cuyo empleado está dado de baja también es INACTIVE.
            status: computeUserStatus({
              active: row.user.isActive && row.isActive,
              blocked: row.user.blockedAt !== null,
            }),
          }
        : null,
    });
  }
}
