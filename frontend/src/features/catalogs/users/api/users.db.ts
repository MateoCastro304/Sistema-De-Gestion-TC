import { ROLE_ORDER, type Rol } from '@/domain/roles'
import { findEmployee } from '@/features/catalogs/employees/api/employees.db'
import type { User, UserStatus } from '../types/user'

/**
 * Tabla de usuarios del mock: la semilla del prototipo (`semilla().usu`).
 * La leen el mock de sesión (login, bloqueo) y el de empleados (columna
 * "Usuario"). Se resetea al recargar la página: un usuario bloqueado a
 * fuerza de intentos vuelve a estar activo.
 *
 * Guarda lo que el backend tiene y nunca devuelve: la contraseña (acá en
 * claro, es un mock) y los intentos fallidos.
 */

/** Contraseña de todos los usuarios de ejemplo, la misma del prototipo. */
export const DEMO_PASSWORD = 'Castro1977'

export interface UserRow {
  id: number
  username: string
  password: string
  employeeId: number
  roles: Rol[]
  /** `false` si fue dado de baja. */
  active: boolean
  /** Llegó a 5 intentos fallidos consecutivos. */
  blocked: boolean
  failedAttempts: number
  lastAccessAt: string | null
  createdAt: string
}

const SEED_DATE = '2026-03-12T12:00:00.000Z'

const user = (
  id: number,
  username: string,
  employeeId: number,
  roles: Rol[],
  lastAccessAt: string | null,
  extra: Partial<UserRow> = {},
): UserRow => ({
  id,
  username,
  password: DEMO_PASSWORD,
  employeeId,
  roles,
  active: true,
  blocked: false,
  failedAttempts: 0,
  lastAccessAt,
  createdAt: SEED_DATE,
  ...extra,
})

// lastAccessAt: el inicio de la última sesión de `semilla().ses`, pasado de
// la hora de Córdoba (UTC-3) a UTC.
export const usersDb = {
  users: [
    user(1, 'wcastro', 1, ['AS'], '2026-10-14T20:20:00.000Z'),
    user(2, 'mrios', 2, ['ERP'], '2026-10-14T12:05:00.000Z'),
    user(3, 'fpaz', 3, ['EC'], '2026-10-14T11:47:00.000Z'),
    user(4, 'lbenitez', 4, ['AT'], '2026-10-13T13:15:00.000Z'),
    user(5, 'rsanchez', 5, ['JT'], '2026-10-13T10:31:00.000Z'),
    user(6, 'gtorres', 6, ['ER'], '2026-09-30T12:12:00.000Z'),
    user(7, 'dcastro', 7, ['ERP', 'EC'], '2026-10-14T11:02:00.000Z'),
    user(8, 'hfunes', 8, ['AT'], '2026-10-06T11:40:00.000Z', { blocked: true, failedAttempts: 5 }),
    user(9, 'ogimenez', 12, ['ERP'], '2026-08-03T11:05:00.000Z', { active: false }),
  ],
  nextId: 10,
}

/** Inactivo le gana a bloqueado (D-26). */
export function statusOf(row: UserRow): UserStatus {
  if (!row.active) return 'INACTIVE'
  return row.blocked ? 'BLOCKED' : 'ACTIVE'
}

export function sortRoles(roles: Rol[]): Rol[] {
  return ROLE_ORDER.filter((role) => roles.includes(role))
}

export function findUser(id: number): UserRow | undefined {
  return usersDb.users.find((u) => u.id === id)
}

export function findUserByEmployee(employeeId: number): UserRow | undefined {
  return usersDb.users.find((u) => u.employeeId === employeeId)
}

/**
 * El usuario como lo devuelve la API: con el nombre de su empleado, el
 * estado calculado y sin contraseña ni intentos fallidos. Lo usan
 * `GET /users` y la respuesta del login.
 */
export function toUserResponse(row: UserRow): User {
  const employee = findEmployee(row.employeeId)
  return {
    id: row.id,
    username: row.username,
    employee: {
      id: row.employeeId,
      firstName: employee?.firstName ?? '',
      lastName: employee?.lastName ?? '',
    },
    roles: sortRoles(row.roles),
    status: statusOf(row),
    lastAccessAt: row.lastAccessAt,
    createdAt: row.createdAt,
  }
}
