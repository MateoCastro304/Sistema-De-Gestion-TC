import type { MaterialListParams } from '../types/material'

/**
 * Claves de React Query de materiales. Están todas en un lugar para que las
 * mutaciones invaliden exactamente lo que registraron las consultas.
 */
export const materialKeys = {
  all: ['materials'] as const,
  lists: () => [...materialKeys.all, 'list'] as const,
  list: (params?: MaterialListParams) => [...materialKeys.lists(), params ?? {}] as const,
  // Cuelga de `lists()`: lo que refresque el listado refresca también el encabezado.
  count: () => [...materialKeys.lists(), 'count'] as const,
  // Las opciones del filtro. Cuelga de `all` y no de `lists()`: no cambia
  // al filtrar, sólo cuando se registra un nombre de material nuevo.
  names: () => [...materialKeys.all, 'names'] as const,
}