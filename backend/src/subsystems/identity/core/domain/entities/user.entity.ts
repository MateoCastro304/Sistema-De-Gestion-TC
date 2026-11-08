import { UserValidationError } from '../errors/user-validation.error';
import { ROLES, Role } from '../value-objects/role.vo';
import { UserStatus, UserStatusResolver } from '../value-objects/user-status.vo';

type CreateData = {
  employeeId: number;
  username: string;
  passwordHash: string;
  roles: Role[];
  createdByUserId?: number | null;
};

type ReconstructData = {
  id: number;
  employeeId: number;
  username: string;
  passwordHash: string;
  roles: Role[];
  active: boolean;
  /** El empleado del usuario no está dado de baja (D-26). */
  employeeActive: boolean;
  /** Tiene un bloqueo de ingreso vigente (`login_attempt.locked_until`). */
  locked: boolean;
  lastAccessAt: Date | null;
  createdByUserId: number | null;
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
    private readonly _employeeActive: boolean,
    private readonly _locked: boolean,
    private _lastAccessAt: Date | null,
    private readonly _createdByUserId: number | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    this._roles = [...roles];
    this.validate();
  }

  // CU-05: toda cuenta nueva nace activa, sin bloqueo ni accesos previos, y
  // para un empleado activo (CreateUser ya lo validó). El username se guarda
  // en minúsculas: la base lo exige (CHECK) y así es único sin distinguir
  // mayúsculas (D-22).
  static create(data: CreateData): User {
    const now = new Date();
    return new User(
      null,
      data.employeeId,
      data.username.trim().toLowerCase(),
      data.passwordHash,
      data.roles,
      true,
      true,
      false,
      null,
      data.createdByUserId ?? null,
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
      data.employeeActive,
      data.locked,
      data.lastAccessAt,
      data.createdByUserId,
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

  // Copia, en el orden canónico de ROLES (User.yaml: "en el orden del
  // enumerado Role"), no el orden en que se guardaron.
  getRoles(): Role[] {
    return [...this._roles].sort((a, b) => ROLES.indexOf(a) - ROLES.indexOf(b));
  }

  getActive(): boolean {
    return this._active;
  }

  getLastAccessAt(): Date | null {
    return this._lastAccessAt;
  }

  getCreatedByUserId(): number | null {
    return this._createdByUserId;
  }

  getCreatedAt(): Date {
    return this._createdAt;
  }

  getUpdatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * UserStatus.yaml: si está dado de baja (o su empleado lo está) Y bloqueado,
   * el estado es INACTIVE (la baja gana). No se persiste; se calcula en cada
   * lectura.
   */
  getStatus(): UserStatus {
    return UserStatusResolver.resolve({
      userActive: this._active,
      employeeActive: this._employeeActive,
      locked: this._locked,
    });
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
