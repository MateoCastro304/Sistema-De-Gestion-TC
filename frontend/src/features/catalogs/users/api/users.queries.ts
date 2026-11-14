import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UserListParams } from '../types/user'
import { employeeOptionKeys, userKeys } from './users.keys'
import { countUsers, createUser, getUser, listUsers, searchEmployeeOptions } from './users.api'

/**
 * CU-07 Listado de usuarios con búsqueda, rol, dados de baja y página.
 * `keepPreviousData` deja la tabla anterior mientras llega la nueva, así no
 * parpadea al tipear en el buscador o al cambiar el filtro.
 */
export function useUsers(params: UserListParams) {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => listUsers(params),
    placeholderData: keepPreviousData,
  })
}

/** Cantidad del encabezado ("8 usuarios activos"): activos y bloqueados. */
export function useUsersCount() {
  return useQuery({
    queryKey: userKeys.count(),
    queryFn: countUsers,
  })
}

/** Detalle de un usuario: a donde lleva el alta después de registrar. */
export function useUser(id: number) {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id),
    // Con un id inválido (/usuarios/abc) no se pide nada: la página muestra
    // directamente "No encontramos…".
    enabled: Number.isInteger(id) && id > 0,
  })
}

/**
 * Empleados que coinciden con lo escrito en el buscador. Sin texto no se
 * pide nada. `keepPreviousData` deja las opciones anteriores mientras llegan
 * las nuevas, para que la lista no parpadee al tipear.
 */
export function useEmployeeOptions(search: string) {
  const term = search.trim()
  return useQuery({
    queryKey: employeeOptionKeys.search(term),
    queryFn: () => searchEmployeeOptions(term),
    enabled: term.length > 0,
    placeholderData: keepPreviousData,
  })
}

/**
 * Alta (CU-05). Un usuario nuevo cambia el listado de usuarios y deja a su
 * empleado con "Ya tiene usuario" en el buscador.
 */
export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      queryClient.setQueryData(userKeys.detail(user.id), user)
      void queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      // Se borran, no se invalidan: invalidar deja ver la búsqueda vieja (el
      // empleado "Sin usuario") hasta que llega la nueva, y en ese instante
      // se lo podía volver a elegir. Son búsquedas chicas: se piden de nuevo.
      queryClient.removeQueries({ queryKey: employeeOptionKeys.all })
    },
  })
}