import type { ProcessTypeListParams } from '../types/process-type'

/**
 * Claves de React Query de tipos de proceso. Están todas en un lugar para que
 * las mutaciones invaliden exactamente lo que registraron las consultas.
 */
export const processTypeKeys = {
  all: ['process-types'] as const,
  lists: () => [...processTypeKeys.all, 'list'] as const,
  // Cada búsqueda y página se guarda por separado: son respuestas distintas.
  list: (params?: ProcessTypeListParams) => [...processTypeKeys.lists(), params ?? {}] as const,
  // El total sin filtros del encabezado ("7 tipos de proceso registrados").
  count: () => [...processTypeKeys.all, 'count'] as const,
  detail: (id: number) => [...processTypeKeys.all, 'detail', id] as const,
  // Cuelga del detalle: invalidar el detalle también refresca su historial.
  history: (id: number) => [...processTypeKeys.detail(id), 'history'] as const,
}

/** La cotización del dólar es otro recurso: no se invalida al tocar un tipo de proceso. */
export const exchangeRateKeys = {
  current: ['exchange-rate'] as const,
}