import { Injectable } from '@nestjs/common';
import { User } from '../../../core/domain/entities/user.entity';
import { UserListParams, UserListResult, UserRepository } from '../../../core/domain/ports/user.repository';

/**
 * Implementación en memoria del puerto UserRepository. Sirve doble
 * propósito: adaptador real hasta que exista un PrismaUserRepository, y
 * fake de los tests. `search` solo filtra por username acá — no puede
 * cruzar contra nombre/apellido del empleado (CU-07 Escenario 2 completo)
 * porque no tiene acceso a los datos del empleado. Queda pendiente.
 */
@Injectable()
export class InMemoryUserRepository implements UserRepository {
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
        employeeActive: true,
        locked: false,
        lastAccessAt: user.getLastAccessAt(),
        createdByUserId: user.getCreatedByUserId(),
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
