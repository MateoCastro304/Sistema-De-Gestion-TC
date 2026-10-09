/**
 * Envelope the API uses for paginated collections (e.g. `GET /customers`).
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
