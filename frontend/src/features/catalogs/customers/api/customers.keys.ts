/**
 * TanStack Query keys for the Customer catalog and the related Factory and
 * Industry catalogs it manages inline. Centralised so that invalidation from
 * mutations always matches what the queries registered.
 */
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
}

export const factoryKeys = {
  all: ['factories'] as const,
  lists: () => [...factoryKeys.all, 'list'] as const,
}

export const industryKeys = {
  all: ['industries'] as const,
}
