import { useQuery } from '@tanstack/react-query'
import { listSuppliers } from './suppliers.api'
import { supplierKeys } from './suppliers.keys'

/** Proveedores vigentes. Los eliminados no vienen: la API no los devuelve. */
export function useSuppliers() {
  return useQuery({
    queryKey: supplierKeys.list(),
    queryFn: listSuppliers,
  })
}
