import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { ClockPort } from '../../../../../shared/clock/clock.port';
import { TextKey } from '../../../../../shared/domain/text-key';
import { PrismaClientProvider } from '../../../../../shared/infrastructure/prisma/prisma-client.provider';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { User } from '../../../core/domain/entities/user.entity';
import { EmployeeAlreadyHasUser } from '../../../core/domain/errors/employee-already-has-user.error';
import { UsernameAlreadyExists } from '../../../core/domain/errors/username-already-exists.error';
import { loginAttemptKey } from '../../../core/domain/login-attempt-key';
import { UserListParams, UserListResult, UserRepository } from '../../../core/domain/ports/user.repository';
import { Role } from '../../../core/domain/value-objects/role.vo';

/** El usuario con sus roles (el código y el orden del prototipo) y si su empleado está activo. */
const USER_INCLUDE = {
  roles: { include: { role: { select: { code: true, sortOrder: true } } } },
  employee: { select: { isActive: true } },
} satisfies Prisma.UserInclude;

type UserRow = Prisma.UserGetPayload<{ include: typeof USER_INCLUDE }>;

/** Los roles se conectan por su código: el catálogo ya está sembrado y un código desconocido falla. */
const connectRoles = (roles: Role[]) => ({ create: roles.map((code) => ({ role: { connect: { code } } })) });

/**
 * Adaptador Prisma del puerto UserRepository (tablas `app_user` y `user_role`).
 *
 * Lo que no se guarda en el usuario se calcula al leer, una sola vez por página:
 * - `BLOCKED` sale de `login_attempt` (un bloqueo vigente sobre `u:<username>`).
 * - `lastAccessAt` es el inicio de su sesión más reciente (D-27).
 * - La baja del empleado también deja al usuario `INACTIVE` (D-26).
 */
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: PrismaClientProvider,
    private readonly clock: ClockPort,
  ) {}

  async save(user: User): Promise<User> {
    const id = user.getId();
    const roles = user.getRoles();

    if (id === null) {
      try {
        const created = await this.clients.current().user.create({
          data: {
            employeeId: user.getEmployeeId(),
            username: user.getUsername(),
            passwordHash: user.getPasswordHash(),
            isActive: user.getActive(),
            createdByUserId: user.getCreatedByUserId(),
            roles: connectRoles(roles),
          },
          include: USER_INCLUDE,
        });
        return (await this.toDomain([created]))[0];
      } catch (error) {
        throw await this.asConflict(error, user);
      }
    }

    // No lo usa ningún caso de uso todavía (CU-06/08 no existen), pero el
    // puerto lo exige para cuando existan. Reemplaza el set de roles entero
    // en vez de diferenciar altas/bajas: más simple, y la cardinalidad
    // (1..6 roles por usuario) hace que el costo sea irrelevante.
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.userRole.deleteMany({ where: { userId: id } });
      return tx.user.update({
        where: { id },
        data: {
          username: user.getUsername(),
          passwordHash: user.getPasswordHash(),
          isActive: user.getActive(),
          roles: connectRoles(roles),
        },
        include: USER_INCLUDE,
      });
    });

    return (await this.toDomain([updated]))[0];
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.clients.current().user.findUnique({ where: { id }, include: USER_INCLUDE });
    return row ? (await this.toDomain([row]))[0] : null;
  }

  // El username se guarda en minúsculas (CHECK de la base), así que
  // comparar en minúsculas de este lado alcanza para CU-05 Escenario 3
  // (único sin distinguir mayúsculas, activo o no — sin filtro de isActive).
  async findByUsername(username: string): Promise<User | null> {
    const normalized = username.trim().toLowerCase();
    // PostgreSQL no acepta un carácter nulo en un texto y la consulta fallaría con un 500.
    if (normalized.includes('\u0000')) return null;

    const row = await this.clients
      .current()
      .user.findUnique({ where: { username: normalized }, include: USER_INCLUDE });
    return row ? (await this.toDomain([row]))[0] : null;
  }

  async findByEmployeeId(employeeId: number): Promise<User | null> {
    const row = await this.clients.current().user.findUnique({ where: { employeeId }, include: USER_INCLUDE });
    return row ? (await this.toDomain([row]))[0] : null;
  }

  async list(params: UserListParams): Promise<UserListResult> {
    const where: Prisma.UserWhereInput = {
      // "Inactivos" son los usuarios dados de baja y también los de un empleado dado de baja.
      ...(params.includeInactive ? {} : { isActive: true, employee: { isActive: true } }),
      ...(params.role ? { roles: { some: { role: { code: params.role } } } } : {}),
      ...PrismaUserRepository.searchFilter(params.search),
    };

    // La forma por lotes de $transaction no existe en el cliente transaccional: es una lectura
    // de consulta, así que usa el cliente base. La página y el total salen del mismo estado.
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: USER_INCLUDE,
        orderBy: [{ username: 'asc' }, { id: 'asc' }],
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: await this.toDomain(rows), total };
  }

  /**
   * `search` coincide con el nombre de usuario o con nombre y apellido del
   * empleado (`employee.search_key`, ya normalizada sin acentos ni mayúsculas).
   */
  private static searchFilter(search: string | undefined): Prisma.UserWhereInput {
    const key = search ? TextKey.create(search).getValue() : '';
    if (!key) return {};

    return { OR: [{ username: { contains: key } }, { employee: { searchKey: { contains: key } } }] };
  }

  /**
   * Entre las consultas de CreateUser y este INSERT hay una ventana: dos altas
   * simultáneas pasan los chequeos y una la rechaza la base (P2002). Se vuelve
   * a consultar para devolver el mismo error de negocio que habría dado el
   * chequeo, sin depender del formato de `error.meta`.
   */
  private async asConflict(error: unknown, user: User): Promise<unknown> {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') return error;

    if (await this.findByUsername(user.getUsername())) return new UsernameAlreadyExists(user.getUsername());

    const existing = await this.findByEmployeeId(user.getEmployeeId());
    if (existing) {
      return new EmployeeAlreadyHasUser(user.getEmployeeId(), existing.getId() as number, existing.getUsername());
    }
    return error;
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

  /** Inicio de la sesión más reciente de cada usuario (D-27). Sin sesiones, no figura. */
  private async lastAccessByUser(userIds: number[]): Promise<Map<number, Date>> {
    if (userIds.length === 0) return new Map();

    const rows = await this.clients.current().userSession.groupBy({
      by: ['userId'],
      where: { userId: { in: userIds } },
      _max: { startedAt: true },
    });
    return new Map(rows.flatMap((row) => (row._max.startedAt ? [[row.userId, row._max.startedAt] as const] : [])));
  }

  private async toDomain(rows: UserRow[]): Promise<User[]> {
    const [locked, lastAccess] = await Promise.all([
      this.lockedUsernames(rows.map((row) => row.username)),
      this.lastAccessByUser(rows.map((row) => row.id)),
    ]);

    return rows.map((row) =>
      User.reconstruct({
        id: row.id,
        employeeId: row.employeeId,
        username: row.username,
        passwordHash: row.passwordHash,
        roles: [...row.roles].sort((a, b) => a.role.sortOrder - b.role.sortOrder).map((r) => r.role.code as Role),
        active: row.isActive,
        employeeActive: row.employee.isActive,
        locked: locked.has(row.username),
        lastAccessAt: lastAccess.get(row.id) ?? null,
        createdByUserId: row.createdByUserId,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }),
    );
  }
}
