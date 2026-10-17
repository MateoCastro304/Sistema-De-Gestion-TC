import { User } from '../entities/user';
import { Role } from '../value-objects/role';

export type UserListParams = {
  page: number;
  limit: number;
  // Busca en username y en nombre/apellido del empleado (CU-07 Escenario 2).
  // El cruce con datos de Employee lo resuelve la implementación (in-memory
  // o Prisma), no este puerto.
  search?: string;
  role?: Role;
  // false (por defecto): solo activos y bloqueados. true: también los dados de baja.
  includeInactive?: boolean;
};

export type UserListResult = {
  items: User[];
  total: number;
};

export abstract class UsersRepository {
  abstract save(user: User): Promise<User>;
  abstract findById(id: number): Promise<User | null>;
  // Único sin distinguir mayúsculas (CU-05 Escenario 3), activo o no.
  abstract findByUsername(username: string): Promise<User | null>;
  // CU-05 Escenario 4: cada empleado tiene como máximo un usuario.
  abstract findByEmployeeId(employeeId: number): Promise<User | null>;
  abstract list(params: UserListParams): Promise<UserListResult>;
}
