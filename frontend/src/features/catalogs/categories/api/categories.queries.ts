import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CategoryInput } from '../types/category'
import { categoryKeys } from './categories.keys'
import {
  createCategory,
  deactivateCategory,
  getCategory,
  listCategories,
  updateCategory,
} from './categories.api'

/** List all rubros (CU-43 Consultar Rubro). */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: listCategories,
  })
}

/** Single rubro by id. */
export function useCategory(id: number) {
  return useQuery({
    queryKey: categoryKeys.detail(id),
    queryFn: () => getCategory(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

/** Create a rubro (CU-41 Registrar Rubro). */
export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all })
    },
  })
}

/** Update a rubro (CU-42 Modificar Rubro). */
export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: CategoryInput }) =>
      updateCategory(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(categoryKeys.detail(updated.id), updated)
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}

/**
 * Baja lógica de un rubro (CU-44). Dado de baja, el rubro no se vuelve a ver
 * ni a modificar desde el frontend.
 */
export function useDeactivateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deactivateCategory,
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: categoryKeys.detail(id) })
      // También refresca el selector de rubro de Fábricas (misma clave).
      queryClient.invalidateQueries({ queryKey: categoryKeys.lists() })
    },
  })
}
