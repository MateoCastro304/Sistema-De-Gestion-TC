/** Máximo de filas por página en cualquier listado. */
export const MAX_PAGE_LIMIT = 1000;

export const PAGE_LIMIT_ERROR = `page must be at least 1 and limit must be between 1 and ${MAX_PAGE_LIMIT}`;

export function isValidPage(page: number, limit: number): boolean {
  return Number.isInteger(page) && Number.isInteger(limit) && page >= 1 && limit >= 1 && limit <= MAX_PAGE_LIMIT;
}
