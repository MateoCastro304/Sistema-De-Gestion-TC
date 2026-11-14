import { http } from '@/shared/api/http'
import type { Page } from '@/shared/api/pagination'
import type { User, UserCreate, UserListParams } from '../types/user'
import type { EmployeeOption } from '../types/employee-option'

const USERS = '/users'
const EMPLOYEES = '/employees'

/** Cuántos empleados muestra el buscador "Empleado" (el prototipo pide `limit=8`). */
export const EMPLOYEE_SEARCH_LIMIT = 8

/** CU-07 Listado de usuarios: búsqueda, rol, dados de baja y página. */
export async function listUsers(params?: UserListParams): Promise<Page<User>> {
  const { data } = await http.get<Page<User>>(USERS, { params })
  return data
}

/**
 * Cantidad de usuarios del encabezado ("8 usuarios activos"): `limit=1` sin
 * filtros y se toma `total`. Cuenta activos y bloqueados, no los dados de
 * baja (D-28).
 */
export async function countUsers(): Promise<number> {
  const { total } = await listUsers({ page: 1, limit: 1 })
  return total
}

/**
 * Los nombres de usuario que empiezan parecido a `base`, incluidos los dados
 * de baja (no se reutilizan, D-22). Alcanza para proponer uno libre: si
 * existen "mcastro" y "mcastro2", se propone "mcastro3".
 */
export async function findSimilarUsernames(base: string): Promise<string[]> {
  const { items } = await listUsers({ search: base, includeInactive: true, limit: 100 })
  return items.map((user) => user.username)
}

export async function getUser(id: number): Promise<User> {
  const { data } = await http.get<User>(`${USERS}/${id}`)
  return data
}

export async function createUser(input: UserCreate): Promise<User> {
  const { data } = await http.post<User>(USERS, input)
  return data
}

/**
 * Empleados activos para el buscador del alta de usuario, ordenados por
 * apellido. Sin texto trae los primeros 8: el buscador los muestra apenas
 * se hace clic, como el prototipo. Trae también los que ya tienen usuario:
 * la opción se muestra con "Ya tiene usuario".
 */
export async function searchEmployeeOptions(search: string): Promise<EmployeeOption[]> {
  const { data } = await http.get<Page<EmployeeOption>>(EMPLOYEES, {
    params: { search: search || undefined, limit: EMPLOYEE_SEARCH_LIMIT },
  })
  return data.items
}

/**
 * Un empleado por id, para dejarlo elegido cuando se llega desde "Crear
 * usuario" del detalle del empleado (`?employeeId=`). `GET /employees/{id}`
 * trae más campos de los que usa el buscador: sobran, no molestan.
 */
export async function getEmployeeOption(id: number): Promise<EmployeeOption> {
  const { data } = await http.get<EmployeeOption>(`${EMPLOYEES}/${id}`)
  return data
}