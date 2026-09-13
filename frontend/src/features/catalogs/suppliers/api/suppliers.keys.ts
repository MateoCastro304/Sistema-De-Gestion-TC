/**
 * Claves de cache de react-query, centralizadas. Se arman en jerarquía para
 * poder invalidar por rama: invalidar `all` limpia listas y detalles de una.
 */
export const supplierKeys = {
  all: ['suppliers'] as const,
  list: () => [...supplierKeys.all, 'list'] as const,
  detail: (id: number) => [...supplierKeys.all, 'detail', id] as const,
}