import { AuthUser } from '../../../core/domain/entities/auth-user.entity';
import { UserAuthRepository } from '../../../core/domain/ports/user-auth.repository';

/** Repositorio en memoria para los tests unitarios de los casos de uso. */
export class InMemoryUserAuthRepository extends UserAuthRepository {
  private readonly users = new Map<number, AuthUser>();

  add(user: AuthUser): void {
    this.users.set(user.getId(), user);
  }

  findByUsername(username: string): Promise<AuthUser | null> {
    const normalized = username.trim().toLowerCase();
    return Promise.resolve([...this.users.values()].find((user) => user.getUsername() === normalized) ?? null);
  }

  findById(userId: number): Promise<AuthUser | null> {
    return Promise.resolve(this.users.get(userId) ?? null);
  }
}
