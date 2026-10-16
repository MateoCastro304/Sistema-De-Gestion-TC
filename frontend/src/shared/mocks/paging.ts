import type { Page } from '@/shared/api/pagination'
import { apiError, validationError } from './errors'

/** Tope de `limit` del backend (`MAX_PAGE_LIMIT`). */
export const MAX_PAGE_LIMIT = 1000

/** Mensaje del 400 de paginación del backend del Sprint 1 (`PAGE_LIMIT_ERROR`). */
export const PAGE_LIMIT_ERROR = `page must be at least 1 and limit must be between 1 and ${MAX_PAGE_LIMIT}`

export interface PageParams {
  page: number
  limit: number
}

/**
 * Lee `page` y `limit` de la query con los defaults del backend (1 y 20).
 * Devuelve `null` si no son enteros en rango: el handler responde 400.
 */
export function readPageParams(url: URL, maxLimit = MAX_PAGE_LIMIT): PageParams | null {
  const page = Number(url.searchParams.get('page') ?? 1)
  const limit = Number(url.searchParams.get('limit') ?? 20)
  const valid = Number.isInteger(page) && Number.isInteger(limit) && page >= 1 && limit >= 1 && limit <= maxLimit
  return valid ? { page, limit } : null
}

/**
 * `page` y `limit` de un listado del Sprint 2, o el 400 VALIDATION_ERROR con
 * el `details` del campo que falló (contrato, `GET /employees`).
 */
export function readPageOrError(request: Request): PageParams | Response {
  const url = new URL(request.url)
  const pageParams = readPageParams(url)
  if (pageParams) return pageParams
  const page = Number(url.searchParams.get('page') ?? 1)
  const details = Number.isInteger(page) && page >= 1
    ? [{ field: 'limit', message: `Debe ser un número entero entre 1 y ${MAX_PAGE_LIMIT}.` }]
    : [{ field: 'page', message: 'Debe ser un número entero mayor o igual a 1.' }]
  return validationError(request, details, 'Los parámetros de consulta no son válidos.')
}

/**
 * Identificador de la ruta como entero, o el 400 INVALID_PATH_PARAMETER del
 * Sprint 2 (`message` es el de cada recurso: "El identificador del empleado
 * no es válido.").
 */
export function readPathId(request: Request, raw: unknown, field: string, message: string): number | Response {
  const id = Number(raw)
  if (Number.isInteger(id) && id > 0) return id
  return apiError(request, 400, message, {
    code: 'INVALID_PATH_PARAMETER',
    details: [{ field, message: 'Debe ser un número entero válido.' }],
  })
}

/** El sobre `{ items, total, page, limit }` de todos los listados. */
export function paginate<T>(items: T[], { page, limit }: PageParams): Page<T> {
  const start = (page - 1) * limit
  return { items: items.slice(start, start + limit), total: items.length, page, limit }
}
