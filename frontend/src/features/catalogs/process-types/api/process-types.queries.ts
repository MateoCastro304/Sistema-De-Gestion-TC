import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ProcessTypeListParams, ProcessTypeUpdate } from '../types/process-type'
import { exchangeRateKeys, processTypeKeys } from './process-types.keys'
import {
  countProcessTypes,
  createProcessType,
  getExchangeRate,
  getProcessType,
  getProcessTypeHistory,
  listProcessTypes,
  updateProcessType,
} from './process-types.api'

export function useProcessTypes(params?: ProcessTypeListParams) {
  return useQuery({
    queryKey: processTypeKeys.list(params),
    queryFn: () => listProcessTypes(params),
    placeholderData: keepPreviousData,
  })
}

export function useProcessTypesCount() {
  return useQuery({
    queryKey: processTypeKeys.count(),
    queryFn: () => countProcessTypes(),
  })
}

export function useProcessType(id: number) {
  return useQuery({
    queryKey: processTypeKeys.detail(id),
    queryFn: () => getProcessType(id),
    // Con un id inválido (/tipos-de-proceso/abc) no se pide nada: la página
    // muestra directamente "No encontramos…".
    enabled: Number.isInteger(id) && id > 0,
  })
}

export function useProcessTypeHistory(id: number) {
  return useQuery({
    queryKey: processTypeKeys.history(id),
    queryFn: () => getProcessTypeHistory(id),
    enabled: Number.isInteger(id) && id > 0,
  })
}

/**
 * Cotización del dólar para precargar el formulario. Sin reintentos: si el
 * backend responde 502 es porque nunca pudo obtenerla, y repetir no lo
 * arregla; el formulario sigue andando con el tipo de cambio a mano.
 */
export function useExchangeRate() {
  return useQuery({
    queryKey: exchangeRateKeys.current,
    queryFn: getExchangeRate,
    retry: false,
  })
}

/** Alta (CU-09). Un tipo nuevo cambia el listado y el total. */
export function useCreateProcessType() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProcessType,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: processTypeKeys.lists() })
      void queryClient.invalidateQueries({ queryKey: processTypeKeys.count() })
    },
  })
}

/**
 * Modificación (CU-10). Invalida el detalle (y con él su historial, que
 * cuelga de esa clave) y el listado, por el precio y la "Última
 * actualización". El total no cambia.
 */
export function useUpdateProcessType(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: ProcessTypeUpdate) => updateProcessType(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: processTypeKeys.detail(id) })
      void queryClient.invalidateQueries({ queryKey: processTypeKeys.lists() })
    },
  })
}