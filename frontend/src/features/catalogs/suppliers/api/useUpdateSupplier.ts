import {useMutation, useQueryClient} from '@tanstack/react-query'
import { updateSupplier } from './suppliers.api'
import type { SupplierUpdate } from '../types/supplier'
import { supplierKeys } from './suppliers.keys'
export function useUpdateSupplier(id:number) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: SupplierUpdate) => updateSupplier(id, payload),
        onSuccess: (supplierUpdated) => {
            //Una vez actualizado el proveedor, lo cargamos en la cache
            queryClient.setQueryData(supplierKeys.detail(id), supplierUpdated)

            // La lista queda stale y se refetchea sola al volver al listado.
            queryClient.invalidateQueries({ queryKey: supplierKeys.list()})
        },
    })
}