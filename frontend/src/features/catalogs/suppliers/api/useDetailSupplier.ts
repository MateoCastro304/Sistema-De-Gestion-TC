import { useQuery } from '@tanstack/react-query'
import { getSupplier } from './suppliers.api'
import { supplierKeys } from './suppliers.keys'

/**
 * Un proveedor por id. El `enabled` frena la consulta si la URL no trae un
 * numero (/suppliers/abc), que si no saldria como un GET a /suppliers/NaN.
 */
export function useSupplier(id: number) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => getSupplier(id),
    enabled: Number.isInteger(id),
  })
}
