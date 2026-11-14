import type { UserListParams } from '../types/user'

/**
 * Claves de React Query de usuarios. Están todas en un lugar para que las
 * mutaciones invaliden exactamente lo que registraron las consultas.
 */
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (params?: UserListParams) => [...userKeys.lists(), params ?? {}] as const,
  // Cuelga de `lists()` para que el alta también refresque el encabezado.
  count: () => [...userKeys.lists(), 'count'] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
}

/**
 * El buscador de empleados del alta. Cuelga de `['employees']` para que, si
 * la feature Empleados invalida todo lo suyo (por ejemplo, al registrar uno),
 * el buscador también se refresque.
 */
export const employeeOptionKeys = {
  all: ['employees', 'user-options'] as const,
  search: (search: string) => [...employeeOptionKeys.all, search] as const,
}