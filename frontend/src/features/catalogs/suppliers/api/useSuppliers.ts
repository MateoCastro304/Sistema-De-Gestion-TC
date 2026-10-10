import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { listSuppliers } from './suppliers.api'
import { supplierKeys } from './suppliers.keys'
import type { SupplierListParams } from '../types/supplier'

/**
 * Una página de proveedores vigentes. Los eliminados no vienen: la API no
 * los devuelve. `keepPreviousData` deja la página anterior a la vista
 * mientras llega la siguiente, para que no parpadee al paginar o al buscar.
 */
export function useSuppliers(params?: SupplierListParams) {
  return useQuery({
    queryKey: supplierKeys.list(params),
    queryFn: () => listSuppliers(params),
    placeholderData: keepPreviousData,
  })
}
