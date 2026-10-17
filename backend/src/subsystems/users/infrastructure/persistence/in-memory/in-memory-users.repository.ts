import { Injectable } from '@nestjs/common';
import { User } from '../../../core/domain/entities/user';
import { UserListParams, UserListResult, UsersRepository } from '../../../core/domain/ports/users.repository';

/**
 * Implementación en memoria del puerto UsersRepository. Sirve doble
 * propósito: adaptador real hasta que exista un UsersPrismaRepository, y
 * fake de los tests. `search` solo filtra por username acá — no puede
 * cruzar contra nombre/apellido del empleado (CU-07 Escenario 2 completo)
 * porque EmployeeQuery no tiene una variante de búsqueda, solo
 * findEmployee(id). Queda pendiente para cuando employees exista.
 */
@Injectable()
export class InMemoryUsersRepository implements UsersRepository {
  private items: User[] = [];
  private nextId = 1;

  async findById(id: number): Promise<User | null> {
    return this.items.find((u) => u.getId() === id) ?? null;
  }

  // Único sin distinguir mayúsculas, activo o no (CU-05 Escenario 3).
  async findByUsername(username: string): Promise<User | null> {
    const needle = username.trim().toLowerCase();
    return this.items.find((u) => u.getUsername().toLowerCase() === needle) ?? null;
  }

  async findByEmployeeId(employeeId: number): Promise<User | null> {
    return this.items.find((u) => u.getEmployeeId() === employeeId) ?? null;
  }

  async list(params: UserListParams): Promise<UserListResult> {
    let filtered = params.includeInactive ? [...this.items] : this.items.filter((u) => u.getActive());

    if (params.role) {
      const role = params.role;
      filtered = filtered.filter((u) => u.getRoles().includes(role));
    }

    if (params.search?.trim()) {
      const needle = params.search.trim().toLowerCase();
      filtered = filtered.filter((u) => u.getUsername().toLowerCase().includes(needle));
    }

    // Orden por username, como pide CU-07.
    filtered = [...filtered].sort((a, b) => a.getUsername().localeCompare(b.getUsername()));

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const items = filtered.slice(start, start + params.limit);

    return { items, total };
  }

  async save(user: User): Promise<User> {
    if (user.getId() === null) {
      const stored = User.reconstruct({
        id: this.nextId++,
        employeeId: user.getEmployeeId(),
        username: user.getUsername(),
        passwordHash: user.getPasswordHash(),
        roles: user.getRoles(),
        active: user.getActive(),
        blocked: user.isBlocked(),
        failedAttempts: user.getFailedAttempts(),
        lastAccessAt: user.getLastAccessAt(),
        createdAt: user.getCreatedAt(),
        updatedAt: user.getUpdatedAt(),
      });
      this.items.push(stored);
      return stored;
    }

    const idx = this.items.findIndex((u) => u.getId() === user.getId());
    if (idx === -1) {
      throw new Error(`User ${user.getId()} not found in memory`);
    }
    this.items[idx] = user;
    return user;
  }

  /** Total de usuarios guardados. Lo usan los tests para verificar efectos. */
  count(): number {
    return this.items.length;
  }
}
