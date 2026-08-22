/**
 * TanStack Query keys for the Customer catalog. Centralised so that
 * invalidation from mutations always matches what the queries registered.
 */
export const customerKeys = {
  all: ['customers'] as const,
  lists: () => [...customerKeys.all, 'list'] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const,
}

export const industryKeys = {
  all: ['industries'] as const,
}
