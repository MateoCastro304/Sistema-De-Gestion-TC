import { Injectable } from '@nestjs/common';
import { Prisma, User as UserRow, UserRole as UserRoleRow } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { User } from '../../../core/domain/entities/user';
import { Role } from '../../../core/domain/value-objects/role';
import { UserListParams, UserListResult, UsersRepository } from '../../../core/domain/ports/users.repository';

type UserRowWithRoles = UserRow & { roles: UserRoleRow[] };

@Injectable()
export class UsersPrismaRepository implements UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(user: User): Promise<User> {
    const id = user.getId();
    const roles = user.getRoles();

    if (id === null) {
      const created = await this.prisma.user.create({
        data: {
          employeeId: user.getEmployeeId(),
          username: user.getUsername(),
          passwordHash: user.getPasswordHash(),
          isActive: user.getActive(),
          roles: { create: roles.map((role) => ({ role })) },
        },
        include: { roles: true },
      });
      return this.toDomain(created);
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
          roles: { create: roles.map((role) => ({ role })) },
        },
        include: { roles: true },
      });
    });

    return this.toDomain(updated);
  }

  async findById(id: number): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id }, include: { roles: true } });
    return row ? this.toDomain(row) : null;
  }

  // El username se guarda en minúsculas (CHECK de la base), así que
  // comparar en minúsculas de este lado alcanza para CU-05 Escenario 3
  // (único sin distinguir mayúsculas, activo o no — sin filtro de isActive).
  async findByUsername(username: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { username: username.trim().toLowerCase() },
      include: { roles: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByEmployeeId(employeeId: number): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { employeeId }, include: { roles: true } });
    return row ? this.toDomain(row) : null;
  }

  async list(params: UserListParams): Promise<UserListResult> {
    const search = params.search?.trim();

    const where: Prisma.UserWhereInput = {
      ...(params.includeInactive ? {} : { isActive: true }),
      ...(params.role ? { roles: { some: { role: params.role } } } : {}),
      // A diferencia del repo in-memory (que no tiene datos de Employee),
      // acá sí se puede cruzar con employee.searchKey — CU-07 Escenario 2
      // completo (username + nombre/apellido del empleado), porque la
      // relación ya existe en el schema aunque el subsystem employees
      // todavía no tenga código.
      ...(search
        ? {
            OR: [
              { username: { contains: search, mode: 'insensitive' as const } },
              { employee: { searchKey: { contains: search, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: { roles: true },
        orderBy: { username: 'asc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  private toDomain(row: UserRowWithRoles): User {
    return User.reconstruct({
      id: row.id,
      employeeId: row.employeeId,
      username: row.username,
      passwordHash: row.passwordHash,
      roles: row.roles.map((r) => r.role as Role),
      active: row.isActive,
      blocked: row.blockedAt !== null,
      failedAttempts: row.failedLoginAttempts,
      // MAX(UserSession.startedAt) (D-27). No hay sesiones todavía — CU-53
      // (login) no existe — así que siempre null por ahora.
      lastAccessAt: null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
