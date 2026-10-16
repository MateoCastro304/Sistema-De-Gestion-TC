/**
 * Envelope the API uses for paginated collections (e.g. `GET /managers`).
 * Mirrors the backend response `{ items, total, page, limit }` (DTC-54): the
 * server does the filtering and paging, so the client just renders the page it
 * gets back and uses `total` to know how many pages there are.
 */
export interface Page<T> {
  items: T[]
  /** Total rows matching the filters, across every page (not just this one). */
  total: number
  /** 1-based index of the page returned. */
  page: number
  /** Page size requested. */
  limit: number
}

/** Filas por página de los listados (coincide con el default del backend). */
export const DEFAULT_PAGE_SIZE = 20

/**
 * Pagina hasta agotar `total`, acumulando los items de cada página. Para
 * catálogos chicos donde se necesita la lista completa en una sola llamada
 * (ej. contar encargados por fábrica) sin pedirle al backend una página más
 * grande que su propio cap (`MAX_PAGE_LIMIT`).
 */
export async function fetchAllPages<T>(
  fetchPage: (page: number, limit: number) => Promise<Page<T>>,
  limit: number,
): Promise<T[]> {
  const items: T[] = []
  let page = 1

  for (;;) {
    const result = await fetchPage(page, limit)
    items.push(...result.items)

    if (items.length >= result.total || result.items.length < limit) {
      return items
    }

    page += 1
  }
}
