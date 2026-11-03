import { http } from '@/shared/api/http'
import type { Page } from '@/shared/api/pagination'
import type { User, UserCreate, UserListParams } from '../types/user'
import type { EmployeeOption } from '../types/employee-option'

const USERS = '/users'

/** Cuántos empleados muestra el buscador "Empleado" (el prototipo pide `limit=8`). */
export const EMPLOYEE_SEARCH_LIMIT = 8

export async function listUsers(params?: UserListParams): Promise<Page<User>> {
  const { data } = await http.get<Page<User>>(USERS, { params })
  return data
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
 * Empleados activos para el buscador del alta de usuario. Trae también los
 * que ya tienen usuario: la opción se muestra con "Ya tiene usuario".
 */
export async function searchEmployeeOptions(search: string): Promise<EmployeeOption[]> {
  const { data } = await http.get<Page<EmployeeOption>>('/employees', {
    params: { search, limit: EMPLOYEE_SEARCH_LIMIT },
  })
  return data.items
}
