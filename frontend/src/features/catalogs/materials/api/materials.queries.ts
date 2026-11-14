import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MaterialListParams } from '../types/material'
import { materialKeys } from './materials.keys'
import { countMaterials, createMaterial, listMaterialNames, listMaterials } from './materials.api'

/**
 * CU-39 Listado de materiales con filtro por material, búsqueda por calidad
 * y página. `keepPreviousData` deja la tabla anterior mientras llega la
 * nueva, así no parpadea al tipear o al cambiar el filtro.
 */
export function useMaterials(params: MaterialListParams) {
  return useQuery({
    queryKey: materialKeys.list(params),
    queryFn: () => listMaterials(params),
    placeholderData: keepPreviousData,
  })
}

/** Cantidad del encabezado ("13 materiales registrados"), sin filtros. */
export function useMaterialsCount() {
  return useQuery({
    queryKey: materialKeys.count(),
    queryFn: countMaterials,
  })
}

/**
 * Los nombres de material distintos, en orden alfabético: las opciones del
 * filtro "Todos los materiales" y las sugerencias del campo "Material" del
 * alta. Las dos comparten esta caché.
 */
export function useMaterialNames() {
  return useQuery({
    queryKey: materialKeys.names(),
    queryFn: listMaterialNames,
  })
}

/**
 * CU-37 Registrar material. Un material nuevo cambia el listado, el contador
 * y, si su nombre no existía, las opciones del filtro: se invalida todo lo
 * de materiales de una vez.
 */
export function useCreateMaterial() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: materialKeys.all })
    },
  })
}