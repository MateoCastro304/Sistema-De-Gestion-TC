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
