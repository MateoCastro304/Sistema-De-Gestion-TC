/**
 * TanStack Query keys for the Customer catalog and the related Factory
 * catalog it manages inline. Los rubros usan las claves de su propia feature
 * (`features/catalogs/categories`), para compartir la caché. Centralised so that invalidation from
 * mutations always matches what the queries registered.
 */
import type { CustomerListParams } from '../types/customer'

export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  // Each combination of filters/página is cached separately: distintos filtros
  // son distintas respuestas del server (items + total).
  list: (params?: CustomerListParams) =>
    [...customerKeys.lists(), params ?? {}] as const,
  // A customer is identified by the composite key (factoryId, id), mirroring the
  // DB primary key (factory_id, id) where id is only unique within a factory.
  detail: (factoryId: string, id: string) =>
    [...customerKeys.all, 'detail', factoryId, id] as const,
}

export const factoryKeys = {
  all: ['factories'] as const,
  lists: () => [...factoryKeys.all, 'list'] as const,
}
