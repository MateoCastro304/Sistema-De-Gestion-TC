import { UserValidationError } from '../errors/user-validation.error';
import { Role } from '../value-objects/role';

export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE';

type CreateData = {
  employeeId: number;
  username: string;
  passwordHash: string;
  roles: Role[];
};

type ReconstructData = {
  id: number;
  employeeId: number;
  username: string;
  passwordHash: string;
  roles: Role[];
  active: boolean;
  blocked: boolean;
  failedAttempts: number;
  lastAccessAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class User {
  private readonly _roles: Role[];

  private constructor(
    private readonly _id: number | null,
    private readonly _employeeId: number,
    private _username: string,
    private _passwordHash: string,
    roles: Role[],
    private _active: boolean,
    private _blocked: boolean,
    private _failedAttempts: number,
    private _lastAccessAt: Date | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    this._roles = [...roles];
    this.validate();
  }

  // CU-05: toda cuenta nueva nace activa, sin bloqueos ni accesos previos.
  // blocked/failedAttempts/lastAccessAt los gobierna el login (CU-53, otro
  // sprint) — acá siempre arrancan en su valor neutro.
  static create(data: CreateData): User {
    const now = new Date();
    return new User(
      null,
      data.employeeId,
      data.username.trim(),
      data.passwordHash,
      data.roles,
      true,
      false,
      0,
      null,
      now,
      now,
    );
  }

  static reconstruct(data: ReconstructData): User {
    return new User(
      data.id,
      data.employeeId,
      data.username,
      data.passwordHash,
      data.roles,
      data.active,
      data.blocked,
      data.failedAttempts,
      data.lastAccessAt,
      data.createdAt,
      data.updatedAt,
    );
  }

  // GETTERS
  getId(): number | null {
    return this._id;
  }

  getEmployeeId(): number {
    return this._employeeId;
  }

  getUsername(): string {
    return this._username;
  }

  getPasswordHash(): string {
    return this._passwordHash;
  }

  // Copia, para que quien la lea no pueda mutar la lista interna.
  getRoles(): Role[] {
    return [...this._roles];
  }

  getActive(): boolean {
    return this._active;
  }

  isBlocked(): boolean {
    return this._blocked;
  }

  getFailedAttempts(): number {
    return this._failedAttempts;
  }

  getLastAccessAt(): Date | null {
    return this._lastAccessAt;
  }

  getCreatedAt(): Date {
    return this._createdAt;
  }

  getUpdatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * UserStatus.yaml: si está dado de baja Y bloqueado, el estado es
   * INACTIVE (la baja gana). No se persiste; se calcula en cada lectura.
   */
  getStatus(): UserStatus {
    if (!this._active) return 'INACTIVE';
    if (this._blocked) return 'BLOCKED';
    return 'ACTIVE';
  }

  private validate() {
    User.assertValidUsername(this._username);
    User.assertAtLeastOneRole(this._roles);
  }

  private static assertValidUsername(username: string) {
    const trimmed = username?.trim() ?? '';
    if (trimmed.length === 0) {
      throw new UserValidationError('Ingresá el nombre de usuario', 'username');
    }
    if (trimmed.length > 30) {
      throw new UserValidationError('El nombre de usuario no puede superar los 30 caracteres', 'username');
    }
  }

  // RN44: todo usuario debe tener al menos un rol.
  private static assertAtLeastOneRole(roles: Role[]) {
    if (roles.length === 0) {
      throw new UserValidationError('Asigná al menos un rol', 'roles');
    }
  }
}
