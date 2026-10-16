import type { Rol } from '@/domain/roles'

/**
 * Usuario del sistema (CU-05 Registrar, CU-07 Consultar), con la forma del
 * contrato del Sprint 2 (§3.3). Pertenece a un empleado y toma de él el
 * nombre de la persona. La contraseña no viaja en ninguna respuesta.
 */

/** Calculado por el backend: inactivo le gana a bloqueado. */
export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE'

export const USER_STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Activo',
  BLOCKED: 'Bloqueado',
  INACTIVE: 'Inactivo',
}

export interface User {
  id: number
  username: string
  employee: { id: number; firstName: string; lastName: string }
  /** Al menos uno, sin repetir, en el orden de la tabla de roles del contrato. */
  roles: Rol[]
  status: UserStatus
  /** Inicio de su última sesión; `null` si nunca ingresó. */
  lastAccessAt: string | null
  createdAt: string
}

/** Cuerpo de `POST /users`. "Repetir contraseña" se resuelve en el formulario. */
export interface UserCreate {
  employeeId: number
  username: string
  password: string
  roles: Rol[]
}

/** Filtros de `GET /users`. */
export interface UserListParams {
  page?: number
  limit?: number
  /** Nombre de usuario y nombre y apellido del empleado. */
  search?: string
  role?: Rol
  includeInactive?: boolean
}
