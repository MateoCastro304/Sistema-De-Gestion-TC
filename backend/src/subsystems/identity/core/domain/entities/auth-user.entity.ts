/** Datos del empleado que viajan en la respuesta de sesión (contrato §3.1). */
export type AuthEmployee = { id: number; firstName: string; lastName: string };

/**
 * Usuario tal como lo necesita la autenticación y la autorización: credenciales,
 * si puede ingresar, a qué empleado pertenece y qué roles y permisos tiene. No
 * es el usuario del ABMC: ese lo maneja su propio caso de uso.
 *
 * `active` ya incluye la baja del empleado (D-26): un usuario cuyo empleado está
 * dado de baja no puede ingresar. Los roles salen en el orden del prototipo y
 * los permisos son la unión de los de todos sus roles.
 */
export class AuthUser {
  private constructor(
    private readonly id: number,
    private readonly username: string,
    private readonly passwordHash: string,
    private readonly active: boolean,
    private readonly employee: AuthEmployee,
    private readonly roles: readonly string[],
    private readonly permissions: readonly string[],
  ) {}

  static reconstruct(data: {
    id: number;
    username: string;
    passwordHash: string;
    active: boolean;
    employee: AuthEmployee;
    roles: readonly string[];
    permissions: readonly string[];
  }): AuthUser {
    return new AuthUser(
      data.id,
      data.username,
      data.passwordHash,
      data.active,
      data.employee,
      data.roles,
      data.permissions,
    );
  }

  /** Si tiene todos los permisos pedidos (los de varios roles se suman). */
  hasAllPermissions(required: readonly string[]): boolean {
    return required.every((permission) => this.permissions.includes(permission));
  }

  getId(): number {
    return this.id;
  }
  getUsername(): string {
    return this.username;
  }
  getPasswordHash(): string {
    return this.passwordHash;
  }
  isActive(): boolean {
    return this.active;
  }
  getEmployee(): AuthEmployee {
    return this.employee;
  }
  getRoles(): readonly string[] {
    return this.roles;
  }
  getPermissions(): readonly string[] {
    return this.permissions;
  }
}
