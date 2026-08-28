import { useQuery } from '@tanstack/react-query'
import { getSupplier } from './suppliers.api'
import { supplierKeys } from './suppliers.keys'

/**
 * Un proveedor por id, para la pantalla de detalle.
 *
 * `enabled` frena la consulta cuando el parametro de la URL no es un numero
 * (ej: /catalogs/suppliers/abc). Sin eso saldria un request a /suppliers/NaN
 * que solo puede terminar en error.
 */
export function useSupplier(id: number) {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: () => getSupplier(id),
    enabled: Number.isInteger(id),
  })
}
