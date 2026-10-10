import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteSupplier } from './suppliers.api'
import { supplierKeys } from './suppliers.keys'

/** Un borrado en lote puede salir a medias, asi que informa las dos listas. */
export interface DeleteSuppliersResult {
  deleted: number[]
  failed: number[]
}

/** Elimina varios proveedores en paralelo, tolerando fallos individuales. */
export function useDeleteSuppliers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (ids: number[]): Promise<DeleteSuppliersResult> => {
      // allSettled y no all: el DELETE da 404 si otro ya lo elimino, y
      // con `all` el primer 404 cancelaria los que si se podian borrar.
      const results = await Promise.allSettled(ids.map((id) => deleteSupplier(id)))

      const deleted: number[] = []
      const failed: number[] = []
      // allSettled conserva el orden, asi que results[i] es siempre de ids[i].
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') deleted.push(ids[index])
        else failed.push(ids[index])
      })

      return { deleted, failed }
    },

    // Corre aunque hayan fallado todos: mutationFn no tiro error, devolvio
    // un resultado. Por eso el if: sin borrados, la lista no cambio.
    onSuccess: ({ deleted }) => {
      if (deleted.length > 0) {
        void queryClient.invalidateQueries({ queryKey: supplierKeys.lists() })
      }

      // remove y no invalidate: invalidar dispararia un GET que da 404.
      deleted.forEach((id) => {
        queryClient.removeQueries({ queryKey: supplierKeys.detail(id) })
      })
    },
  })
}
