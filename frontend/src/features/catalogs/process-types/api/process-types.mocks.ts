import { http, HttpResponse } from 'msw'
import { MODULE_ROLES } from '@/domain/roles'
import { apiError, validationError, type FieldError } from '@/shared/mocks/errors'
import { paginate, readPageOrError, readPathId } from '@/shared/mocks/paging'
import { authorize } from '@/shared/mocks/session'
import { containsText, sameText } from '@/shared/mocks/text'
import { findUser } from '@/features/catalogs/users/api/users.db'
import type {
  ProcessType,
  ProcessTypeCreate,
  ProcessTypeUpdate,
} from '../types/process-type'
import { CURRENT_EXCHANGE_RATE, findProcessTypeRow, processTypesDb } from './process-types.db'

/**
 * MSW handlers de tipos de proceso (CU-09 Registrar, CU-10 Modificar, CU-11
 * Consultar) y del tipo de cambio, según el contrato del Sprint 2 (§3.4 y
 * §3.5). Para el Administrativo Técnico y el Encargado de Cotización.
 *
 * Los precios se guardan tal como llegan: el cálculo pesos ↔ dólares lo hace
 * el formulario (D-29).
 */

const ROLES = MODULE_ROLES.processTypes

const NAME_TAKEN = 'Ya existe un tipo de proceso con ese nombre'

/** Mayor a 0 y con hasta dos decimales (D-35). */
function moneyProblem(value: unknown): 'missing' | 'invalid' | 'decimals' | null {
  if (value === undefined || value === null || value === '') return 'missing'
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 'invalid'
  return Math.abs(value * 100 - Math.round(value * 100)) > 1e-9 ? 'decimals' : null
}

const PRICE_MESSAGES = {
  hourlyRateArs: { label: 'pesos' },
  hourlyRateUsd: { label: 'dólares' },
} as const

const EXCHANGE_RATE_MESSAGE = 'Ingresá un tipo de cambio mayor a 0, con hasta dos decimales'

/**
 * Valida el cuerpo. En el alta todo es obligatorio salvo la descripción; en
 * la modificación sólo se valida lo que vino, y el tipo de cambio pasa a ser
 * obligatorio si viajó algún precio.
 */
function validate(body: ProcessTypeUpdate, creating: boolean): FieldError[] {
  const errors: FieldError[] = []

  if (creating || body.name !== undefined) {
    const name = body.name?.trim() ?? ''
    if (!name) errors.push({ field: 'name', message: 'Ingresá el nombre del tipo de proceso' })
    else if (name.length > 100) errors.push({ field: 'name', message: 'El nombre admite hasta 100 caracteres' })
  }
  if ((body.description?.trim().length ?? 0) > 500) {
    errors.push({ field: 'description', message: 'La descripción admite hasta 500 caracteres' })
  }
  for (const field of ['hourlyRateArs', 'hourlyRateUsd'] as const) {
    if (!creating && body[field] === undefined) continue
    const { label } = PRICE_MESSAGES[field]
    const problem = moneyProblem(body[field])
    if (problem === 'missing') errors.push({ field, message: `Ingresá el precio hora en ${label}` })
    if (problem === 'invalid') errors.push({ field, message: `El precio hora en ${label} tiene que ser un número mayor a 0` })
    if (problem === 'decimals') errors.push({ field, message: `El precio hora en ${label} admite como máximo dos decimales` })
  }
  const pricesSent = body.hourlyRateArs !== undefined || body.hourlyRateUsd !== undefined
  if (creating || pricesSent || body.exchangeRate !== undefined) {
    if (moneyProblem(body.exchangeRate)) errors.push({ field: 'exchangeRate', message: EXCHANGE_RATE_MESSAGE })
  }
  return errors
}

/** Unicidad del nombre sin mayúsculas, acentos ni espacios repetidos (D-34). */
function nameTaken(name: string, exceptId?: number) {
  return processTypesDb.rows.some((r) => r.processType.id !== exceptId && sameText(r.processType.name, name))
}

function nameConflict(request: Request) {
  return apiError(request, 409, NAME_TAKEN, {
    code: 'PROCESS_TYPE_NAME_TAKEN',
    details: [{ field: 'name', message: NAME_TAKEN }],
  })
}

function notFound(request: Request) {
  return apiError(request, 404, 'No se encontró el tipo de proceso solicitado.', { code: 'PROCESS_TYPE_NOT_FOUND' })
}

function readId(request: Request, raw: unknown) {
  return readPathId(request, raw, 'processTypeId', 'El identificador del tipo de proceso no es válido.')
}

/**
 * Simula que el backend nunca pudo obtener la cotización del dólar (`502`).
 * Se prende escribiendo esta clave en `localStorage` (lo hacen los tests E2E
 * antes de cargar la app); sin ella, `/exchange-rate` responde la cotización.
 */
const MOCK_EXCHANGE_RATE_DOWN_KEY = 'castro-mock-exchange-rate-down'

const EXCHANGE_RATE_UNAVAILABLE = 'No se pudo obtener la cotización del dólar. Ingresá el tipo de cambio a mano.'

function exchangeRateUnavailable(): boolean {
  try {
    return localStorage.getItem(MOCK_EXCHANGE_RATE_DOWN_KEY) !== null
  } catch {
    return false
  }
}

/** Los datos cuyo cambio cuenta como modificación (el tipo de cambio solo, no). */
const TRACKED = ['name', 'description', 'hourlyRateArs', 'hourlyRateUsd'] as const

export const processTypeHandlers = [
  http.get('/api/exchange-rate', ({ request }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller
    if (exchangeRateUnavailable()) {
      return apiError(request, 502, EXCHANGE_RATE_UNAVAILABLE, { code: 'EXCHANGE_RATE_UNAVAILABLE' })
    }
    return HttpResponse.json(CURRENT_EXCHANGE_RATE)
  }),

  http.get('/api/process-types', ({ request }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller
    const pageParams = readPageOrError(request)
    if (pageParams instanceof Response) return pageParams

    const search = new URL(request.url).searchParams.get('search')?.trim() ?? ''
    const matching = processTypesDb.rows
      .map((r) => r.processType)
      .filter((p) => containsText(p.name, search))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
    return HttpResponse.json(paginate(matching, pageParams))
  }),

  http.get('/api/process-types/:processTypeId', ({ request, params }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller
    const id = readId(request, params.processTypeId)
    if (id instanceof Response) return id
    const row = findProcessTypeRow(id)
    if (!row) return notFound(request)
    return HttpResponse.json(row.processType)
  }),

  // Del más reciente al más antiguo, sin paginar (D-32).
  http.get('/api/process-types/:processTypeId/history', ({ request, params }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller
    const id = readId(request, params.processTypeId)
    if (id instanceof Response) return id
    const row = findProcessTypeRow(id)
    if (!row) return notFound(request)
    return HttpResponse.json({ items: row.history })
  }),

  http.post('/api/process-types', async ({ request }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller

    const body = (await request.json()) as ProcessTypeCreate
    const errors = validate(body, true)
    if (errors.length > 0) return validationError(request, errors)
    if (nameTaken(body.name)) return nameConflict(request)

    const now = new Date().toISOString()
    const created: ProcessType = {
      id: processTypesDb.nextId++,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      hourlyRateArs: body.hourlyRateArs,
      hourlyRateUsd: body.hourlyRateUsd,
      exchangeRate: body.exchangeRate,
      createdAt: now,
      updatedAt: now,
    }
    // El alta no genera registros en el historial.
    processTypesDb.rows.push({ processType: created, history: [] })
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch('/api/process-types/:processTypeId', async ({ request, params }) => {
    const caller = authorize(request, ROLES)
    if (caller instanceof Response) return caller
    const id = readId(request, params.processTypeId)
    if (id instanceof Response) return id

    const body = (await request.json()) as ProcessTypeUpdate
    if (Object.values(body).every((value) => value === undefined)) {
      return validationError(request, [], 'Enviá al menos un campo para modificar.')
    }
    const errors = validate(body, false)
    if (errors.length > 0) return validationError(request, errors)
    const row = findProcessTypeRow(id)
    if (!row) return notFound(request)
    if (body.name !== undefined && nameTaken(body.name, id)) return nameConflict(request)

    const current = row.processType
    const next: ProcessType = {
      ...current,
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.description !== undefined ? { description: body.description?.trim() || null } : {}),
      ...(body.hourlyRateArs !== undefined ? { hourlyRateArs: body.hourlyRateArs } : {}),
      ...(body.hourlyRateUsd !== undefined ? { hourlyRateUsd: body.hourlyRateUsd } : {}),
    }

    // El tipo de cambio sólo se guarda junto con un cambio de precio (D-52):
    // es el que vincula los dos precios. Si llega sin que cambie ningún
    // precio, se ignora.
    const pricesChanged =
      current.hourlyRateArs !== next.hourlyRateArs || current.hourlyRateUsd !== next.hourlyRateUsd
    if (pricesChanged) next.exchangeRate = body.exchangeRate ?? current.exchangeRate

    // Sin cambios (D-31): 200 con lo que había, sin tocar updatedAt ni el historial.
    const changed = TRACKED.filter((key) => current[key] !== next[key])
    if (changed.length === 0) return HttpResponse.json(current)

    const changedAt = new Date().toISOString()
    const changedBy = { id: caller.userId, username: findUser(caller.userId)?.username ?? '—' }
    // El historial es de precios, mostrados en dólares (D-32, como la tabla del
    // prototipo): un registro si cambió alguno de los dos precios. Nombre o
    // descripción solos no dejan registro.
    if (pricesChanged) {
      const entry = {
        id: processTypesDb.nextHistoryId++,
        changedAt,
        changedBy,
        exchangeRate: next.exchangeRate,
        previousValueUsd: current.hourlyRateUsd,
        newValueUsd: next.hourlyRateUsd,
      }
      row.history = [entry, ...row.history]
    }
    row.processType = { ...next, updatedAt: changedAt }
    return HttpResponse.json(row.processType)
  }),
]
