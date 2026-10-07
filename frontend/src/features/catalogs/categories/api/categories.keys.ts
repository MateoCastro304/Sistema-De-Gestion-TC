/**
 * TanStack Query keys for the Rubros (Categories) catalog.
 *
 * Centralised so the key a mutation invalidates always matches the one its
 * queries registered. Keys are hierarchical arrays and invalidation matches by
 * prefix, so `invalidateQueries({ queryKey: categoryKeys.all })` reaches every
 * list and every detail at once.
 */
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  /** Numeric id, matching `Category.id` in the contract. */
  detail: (id: number) => [...categoryKeys.all, 'detail', id] as const,
}
