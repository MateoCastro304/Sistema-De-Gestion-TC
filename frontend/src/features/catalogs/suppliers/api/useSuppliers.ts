import { useQuery } from '@tanstack/react-query'
import { listSuppliers } from './suppliers.api'
import { supplierKeys } from './suppliers.keys'

/** Lista completa de proveedores, activos e inactivos. */
export function useSuppliers() {
  return useQuery({
    queryKey: supplierKeys.list(),
    queryFn: listSuppliers,
  })
}
