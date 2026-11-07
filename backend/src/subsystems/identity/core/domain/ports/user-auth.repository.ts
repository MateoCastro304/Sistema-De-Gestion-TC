import { AuthUser } from '../entities/auth-user.entity';

/** Lectura de usuarios para autenticar y autorizar. El ABMC de usuarios tiene su propio repositorio. */
export abstract class UserAuthRepository {
  /** Busca por username sin distinguir mayúsculas; `null` si no existe. */
  abstract findByUsername(username: string): Promise<AuthUser | null>;

  /** Busca por id con sus roles y permisos vigentes; `null` si no existe. */
  abstract findById(userId: number): Promise<AuthUser | null>;
}
