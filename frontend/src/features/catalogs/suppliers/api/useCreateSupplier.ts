import {useMutation, useQueryClient} from '@tanstack/react-query'
import { createSupplier } from './suppliers.api'
import type { SupplierCreate } from '../types/supplier'
import { supplierKeys } from './suppliers.keys'

export function useCreateSupplier(){
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: SupplierCreate) => createSupplier(payload),
        onSuccess: (supplierCreated) => {
            // Sembramos el detalle: si navegamos al proveedor recien creado,
            // la pantalla ya tiene el dato y no pide nada.
            queryClient.setQueryData(supplierKeys.detail(supplierCreated.id), supplierCreated)
            // La lista queda stale y se refetchea sola al volver al listado.
            void queryClient.invalidateQueries({ queryKey: supplierKeys.lists()})
        }
    })
}
