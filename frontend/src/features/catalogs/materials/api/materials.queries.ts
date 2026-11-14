import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { MaterialListParams } from '../types/material'
import { materialKeys } from './materials.keys'
import { countMaterials, listMaterialNames, listMaterials } from './materials.api'

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
 * filtro "Todos los materiales" (y, en el alta, las del campo "Material").
 */
export function useMaterialNames() {
  return useQuery({
    queryKey: materialKeys.names(),
    queryFn: listMaterialNames,
  })
}