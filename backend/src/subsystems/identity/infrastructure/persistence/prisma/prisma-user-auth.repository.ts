import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaClientProvider } from '../../../../../shared/infrastructure/prisma/prisma-client.provider';
import { AuthUser } from '../../../core/domain/entities/auth-user.entity';
import { UserAuthRepository } from '../../../core/domain/ports/user-auth.repository';

/** El usuario con su empleado y, por cada rol, los permisos que otorga. */
const AUTH_USER_INCLUDE = {
  employee: true,
  roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
} satisfies Prisma.UserInclude;

type AuthUserRow = Prisma.UserGetPayload<{ include: typeof AUTH_USER_INCLUDE }>;

@Injectable()
export class PrismaUserAuthRepository extends UserAuthRepository {
  constructor(private readonly clients: PrismaClientProvider) {
    super();
  }

  async findByUsername(username: string): Promise<AuthUser | null> {
    // El username se guarda en minúsculas (CHECK), así que la búsqueda es insensible a mayúsculas.
    const normalized = username.trim().toLowerCase();
    // PostgreSQL no acepta un carácter nulo en un texto y la consulta fallaría con un 500.
    // Un username así no puede existir: el login es público y lo manda un desconocido.
    if (normalized.includes('\u0000')) return null;

    const row = await this.clients.current().user.findUnique({
      where: { username: normalized },
      include: AUTH_USER_INCLUDE,
    });
    return row ? PrismaUserAuthRepository.toDomain(row) : null;
  }

  async findById(userId: number): Promise<AuthUser | null> {
    const row = await this.clients.current().user.findUnique({
      where: { id: userId },
      include: AUTH_USER_INCLUDE,
    });
    return row ? PrismaUserAuthRepository.toDomain(row) : null;
  }

  private static toDomain(row: AuthUserRow): AuthUser {
    // Los roles salen en el orden del prototipo, no en el que se asignaron.
    const roles = [...row.roles].sort((a, b) => a.role.sortOrder - b.role.sortOrder).map((r) => r.role.code);
    const permissions = [
      ...new Set(row.roles.flatMap((r) => r.role.permissions.map((rp) => rp.permission.code))),
    ].sort();

    return AuthUser.reconstruct({
      id: row.id,
      username: row.username,
      passwordHash: row.passwordHash,
      // La baja del empleado desactiva al usuario (D-26, RN44).
      active: row.isActive && row.employee.isActive,
      employee: { id: row.employee.id, firstName: row.employee.firstName, lastName: row.employee.lastName },
      roles,
      permissions,
      createdAt: row.createdAt,
    });
  }
}
