import type { SupplierListParams } from '../types/supplier'

/**
 * Claves de cache de react-query, centralizadas. Se arman en jerarquía para
 * poder invalidar por rama: invalidar `all` limpia listas y detalles de una.
 */
export const supplierKeys = {
  all: ['suppliers'] as const,
  lists: () => [...supplierKeys.all, 'list'] as const,
  // Cada combinación de búsqueda y página se cachea aparte: son respuestas
  // distintas del backend (items + total).
  list: (params?: SupplierListParams) => [...supplierKeys.lists(), params ?? {}] as const,
  detail: (id: number) => [...supplierKeys.all, 'detail', id] as const,
}
