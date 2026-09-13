/**
 * TanStack Query keys for the Customer catalog and the related Factory and
 * Industry catalogs it manages inline. Centralised so that invalidation from
 * mutations always matches what the queries registered.
 */
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  // A customer is identified by the composite key (factoryId, id), mirroring the
  // DB primary key (factory_id, id) where id is only unique within a factory.
  detail: (factoryId: string, id: string) =>
    [...customerKeys.all, 'detail', factoryId, id] as const,
}

export const factoryKeys = {
  all: ['factories'] as const,
  lists: () => [...factoryKeys.all, 'list'] as const,
}

export const industryKeys = {
  all: ['industries'] as const,
}
