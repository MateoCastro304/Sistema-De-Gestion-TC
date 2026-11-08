/** Estado de un usuario (UserStatus.yaml). */
export const USER_STATUSES = ['ACTIVE', 'BLOCKED', 'INACTIVE'] as const;

export type UserStatus = (typeof USER_STATUSES)[number];

/** Lo que hace falta saber para calcular el estado de un usuario. */
export type UserStatusFacts = {
  /** El usuario no está dado de baja. */
  readonly userActive: boolean;
  /** El empleado del usuario no está dado de baja. */
  readonly employeeActive: boolean;
  /** Tiene un bloqueo de ingreso vigente (`login_attempt.locked_until` en el futuro). */
  readonly locked: boolean;
};

/**
 * El estado no se guarda, se calcula (D-26). Es una sola regla para todo el
 * subsistema: la usan el resumen `user` de un empleado y el recurso usuario.
 *
 * La baja gana sobre el bloqueo: un usuario dado de baja, o cuyo empleado lo
 * está, es INACTIVE aunque además tenga un bloqueo vigente.
 */
export class UserStatusResolver {
  static resolve({ userActive, employeeActive, locked }: UserStatusFacts): UserStatus {
    if (!userActive || !employeeActive) return 'INACTIVE';
    return locked ? 'BLOCKED' : 'ACTIVE';
  }
}
