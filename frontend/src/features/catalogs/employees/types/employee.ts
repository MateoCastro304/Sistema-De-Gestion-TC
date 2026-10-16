import type { Rol } from '@/domain/roles'

/**
 * Empleado (CU-45 Registrar, CU-47 Consultar), con la forma del contrato del
 * Sprint 2 (`docs/api-contract/API_CONTRACT_SPRINT_2.md`, §3.2). Un empleado
 * puede existir sin usuario: no todo el personal del taller usa el sistema.
 */

/** Puesto del empleado. No es un rol: el rol es un permiso del usuario (RN44). */
export type EmployeePosition = 'ADMINISTRATION' | 'WORKSHOP_HEAD' | 'HEAD' | 'EMPLOYEE'

/** En el orden del desplegable del prototipo. */
export const EMPLOYEE_POSITIONS: EmployeePosition[] = ['ADMINISTRATION', 'WORKSHOP_HEAD', 'HEAD', 'EMPLOYEE']

export const EMPLOYEE_POSITION_LABELS: Record<EmployeePosition, string> = {
  ADMINISTRATION: 'Administración',
  WORKSHOP_HEAD: 'Jefe de taller',
  HEAD: 'Jefe',
  EMPLOYEE: 'Empleado',
}

export type UserStatus = 'ACTIVE' | 'BLOCKED' | 'INACTIVE'

/** Resumen del usuario del empleado: columnas "Usuario" y "Roles" del listado. */
export interface EmployeeUserSummary {
  id: number
  username: string
  roles: Rol[]
  status: UserStatus
}

export interface Employee {
  id: number
  firstName: string
  lastName: string
  /** Sólo números, 7 u 8. Único entre todos los empleados, incluidos los dados de baja. */
  dni: string
  position: EmployeePosition
  address: string | null
  email: string | null
  phone: string | null
  /** `false` si fue dado de baja. A diferencia de los proveedores, no desaparece. */
  active: boolean
  user: EmployeeUserSummary | null
  createdAt: string
  updatedAt: string
}

/** Cuerpo de `POST /employees`. Un opcional vacío (`''`) se guarda como `null`. */
export interface EmployeeCreate {
  firstName: string
  lastName: string
  dni: string
  position: EmployeePosition
  address?: string | null
  email?: string | null
  phone?: string | null
}

/** Filtros de `GET /employees`. */
export interface EmployeeListParams {
  page?: number
  limit?: number
  /** Nombre, apellido, DNI o rótulo del puesto. */
  search?: string
  includeInactive?: boolean
  hasUser?: boolean
}
