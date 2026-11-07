import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { ClockPort } from '../../../../../shared/clock/clock.port';
import { TextKey } from '../../../../../shared/domain/text-key';
import { PrismaClientProvider } from '../../../../../shared/infrastructure/prisma/prisma-client.provider';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { Employee } from '../../../core/domain/entities/employee.entity';
import { EmployeeDniTaken } from '../../../core/domain/errors/employee-dni-taken.error';
import { loginAttemptKey } from '../../../core/domain/login-attempt-key';
import {
  EmployeeListParams,
  EmployeeListResult,
  EmployeeRepository,
} from '../../../core/domain/ports/employee.repository';
import { EMPLOYEE_POSITIONS, EMPLOYEE_POSITION_LABELS } from '../../../core/domain/value-objects/employee-position.vo';
import { UserStatusResolver } from '../../../core/domain/value-objects/user-status.vo';

// Solo los datos del usuario que forman el resumen `user`. Nunca el hash de la contraseña.
// Los roles salen en el orden del prototipo (`role.sort_order`).
const USER_SUMMARY = {
  user: {
    select: {
      id: true,
      username: true,
      isActive: true,
      roles: { select: { role: { select: { code: true } } }, orderBy: { role: { sortOrder: 'asc' } } },
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
 *
 * El resumen `user` de cada empleado trae su estado. `BLOCKED` no está en la fila
 * del usuario: sale de `login_attempt` (un bloqueo vigente sobre `u:<username>`),
 * así que se consulta aparte, una vez por página y no una por empleado.
 */
@Injectable()
export class PrismaEmployeeRepository implements EmployeeRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: PrismaClientProvider,
    private readonly clock: ClockPort,
  ) {}

  async findById(id: number): Promise<Employee | null> {
    const row = await this.clients.current().employee.findUnique({ where: { id }, include: USER_SUMMARY });
    return row ? (await this.toDomain([row]))[0] : null;
  }

  async findByIds(ids: number[]): Promise<Employee[]> {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return [];

    const rows = await this.clients.current().employee.findMany({
      where: { id: { in: unique } },
      include: USER_SUMMARY,
    });
    return this.toDomain(rows);
  }

  async existsByDni(dni: string): Promise<boolean> {
    const count = await this.clients.current().employee.count({ where: { dni } });
    return count > 0;
  }

  async list(params: EmployeeListParams): Promise<EmployeeListResult> {
    const where: Prisma.EmployeeWhereInput = {
      ...(params.includeInactive ? {} : { isActive: true }),
      ...(params.hasUser === undefined ? {} : { user: params.hasUser ? { isNot: null } : { is: null } }),
      ...PrismaEmployeeRepository.searchFilter(params.search),
    };

    // La forma por lotes de $transaction no existe en el cliente transaccional: es una lectura
    // de consulta, así que usa el cliente base. La página y el total salen del mismo estado.
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

    return { items: await this.toDomain(rows), total };
  }

  async save(employee: Employee): Promise<Employee> {
    try {
      const row = await this.clients.current().employee.create({
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
          createdByUserId: employee.getCreatedByUserId(),
        },
        include: USER_SUMMARY,
      });
      return (await this.toDomain([row]))[0];
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

  /** Usernames con un bloqueo de ingreso vigente, de todos los que se pidan en una sola consulta. */
  private async lockedUsernames(usernames: string[]): Promise<Set<string>> {
    if (usernames.length === 0) return new Set();

    const keyOf = (username: string) => loginAttemptKey('username', { username, ip: '' });
    const locked = await this.clients.current().loginAttempt.findMany({
      where: { identifier: { in: usernames.map(keyOf) }, lockedUntil: { gt: this.clock.now() } },
      select: { identifier: true },
    });
    const lockedKeys = new Set(locked.map((attempt) => attempt.identifier));
    return new Set(usernames.filter((username) => lockedKeys.has(keyOf(username))));
  }

  private async toDomain(rows: EmployeeRow[]): Promise<Employee[]> {
    const locked = await this.lockedUsernames(rows.flatMap((row) => (row.user ? [row.user.username] : [])));

    return rows.map((row) =>
      Employee.reconstruct({
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
        createdByUserId: row.createdByUserId,
        user: row.user
          ? {
              id: row.user.id,
              username: row.user.username,
              roles: row.user.roles.map((userRole) => userRole.role.code),
              status: UserStatusResolver.resolve({
                userActive: row.user.isActive,
                employeeActive: row.isActive,
                locked: locked.has(row.user.username),
              }),
            }
          : null,
      }),
    );
  }
}
