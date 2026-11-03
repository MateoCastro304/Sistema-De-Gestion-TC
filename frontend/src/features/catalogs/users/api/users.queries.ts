import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { employeeOptionKeys, userKeys } from './users.keys'
import { createUser, getUser, searchEmployeeOptions } from './users.api'

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
      void queryClient.invalidateQueries({ queryKey: employeeOptionKeys.all })
    },
  })
}
