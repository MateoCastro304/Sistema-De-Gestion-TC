import { HttpResponse } from 'msw'

/**
 * Cuerpos de error de los mocks, con la forma del backend
 * (`AllExceptionsFilter`, `docs/openapi/components/schemas/Error.yaml`):
 * `statusCode`, `error`, `message`, `path`, `timestamp` y, cuando hay campos
 * en juego, `details`.
 *
 * Desde el Sprint 2 los errores suman `code` (contrato §5.2): lo usa el
 * cliente para decidir qué hacer. Los mocks del Sprint 1 todavía no lo
 * mandan porque el backend del Sprint 1 tampoco.
 */

const STATUS_NAMES: Record<number, string> = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  409: 'Conflict',
  422: 'Unprocessable Content',
  423: 'Locked',
  500: 'Internal Server Error',
  502: 'Bad Gateway',
}

export interface FieldError {
  field: string
  message: string
}

interface ApiErrorOptions {
  /** Código del catálogo del contrato (Sprint 2). */
  code?: string
  details?: FieldError[]
  /** Campos sueltos que algunos módulos del Sprint 1 agregan (`field`, `id`, `categoryId`). */
  extra?: Record<string, unknown>
}

/** `path` como lo informa Nest: la URL pedida, con su query. */
function pathOf(request: Request): string {
  const url = new URL(request.url)
  return url.pathname + url.search
}

export function apiError(
  request: Request,
  status: number,
  message: string,
  { code, details, extra }: ApiErrorOptions = {},
) {
  return HttpResponse.json(
    {
      statusCode: status,
      error: STATUS_NAMES[status] ?? 'Error',
      ...(code ? { code } : {}),
      message,
      path: pathOf(request),
      timestamp: new Date().toISOString(),
      ...(details ? { details } : {}),
      ...extra,
    },
    { status },
  )
}

/** 400 VALIDATION_ERROR del Sprint 2, con un `details` por campo. */
export function validationError(request: Request, details: FieldError[], message = 'Los datos enviados no son válidos.') {
  return apiError(request, 400, message, { code: 'VALIDATION_ERROR', details })
}
