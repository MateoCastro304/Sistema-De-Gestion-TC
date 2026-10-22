import { http, HttpResponse } from 'msw'
import { normalizeText } from '@/shared/lib/normalizeText'
import { apiError } from '@/shared/mocks/errors'
import { PAGE_LIMIT_ERROR, paginate, readPageParams } from '@/shared/mocks/paging'
import { customersDb } from '@/features/catalogs/customers/api/customers.db'
import type { Category, CategoryInput } from '../types/category'
import { categoriesDb, findCategory } from './categories.db'

/**
 * MSW handlers that stand in for the backend's `Categories` module. Copian
 * al backend (`backend/src/subsystems/customers`), que es lo que la pantalla
 * tiene que soportar: baja lógica con `active`, reactivación en el alta y con
 * `/restore`, mínimo de 3 caracteres y los mensajes de los 409. Donde difiere
 * del contrato, ver `docs/rubros-desvios-contrato.md`.
 */

const NAME_MIN_LENGTH = 3

/** Como el backend: sin distinguir mayúsculas ni espacios en los extremos. */
const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

function notFound(request: Request, id: number) {
  return apiError(request, 404, `Category with id ${id} not found`, { extra: { id } })
}

/** CategoryValidationError: 400 con el campo `name` en `details`. */
function invalidName(request: Request, name: string | undefined) {
  const trimmed = name?.trim() ?? ''
  if (trimmed === '') {
    return apiError(request, 400, 'Category name cannot be empty', {
      details: [{ field: 'name', message: 'Category name cannot be empty' }],
    })
  }
  if (trimmed.length < NAME_MIN_LENGTH) {
    const message = `Category name must be at least ${NAME_MIN_LENGTH} characters long`
    return apiError(request, 400, message, { details: [{ field: 'name', message }] })
  }
  return null
}

/** Fábricas activas que usan el rubro: con alguna, la baja responde 409. */
function activeFactoriesOf(categoryId: number) {
  return customersDb.factories.filter((f) => f.isActive && f.categoryId === String(categoryId))
}

export const categoryHandlers = [
  http.get('/api/categories', ({ request }) => {
    const url = new URL(request.url)
    const pageParams = readPageParams(url)
    if (!pageParams) return apiError(request, 400, PAGE_LIMIT_ERROR)
    // Como el backend: activos por defecto, o sólo los dados de baja con
    // ?active=false; `name` filtra por "contiene".
    const wantActive = url.searchParams.get('active') !== 'false'
    const name = normalizeText(url.searchParams.get('name')?.trim() ?? '')
    const matching = categoriesDb.categories
      .filter((c) => c.active === wantActive)
      .filter((c) => normalizeText(c.name).includes(name))
    return HttpResponse.json(paginate(matching, pageParams))
  }),

  http.get('/api/categories/:id', ({ request, params }) => {
    const id = Number(params.id)
    const category = findCategory(id)
    if (!category) return notFound(request, id)
    return HttpResponse.json(category)
  }),

  http.post('/api/categories', async ({ request }) => {
    const body = (await request.json()) as CategoryInput
    const invalid = invalidName(request, body.name)
    if (invalid) return invalid

    const existing = categoriesDb.categories.find((c) => sameName(c.name, body.name))
    if (existing?.active) return apiError(request, 409, 'Ya existe un rubro con ese nombre')
    // Como el backend: si el nombre es de un rubro dado de baja, el alta lo
    // reactiva (conserva su nombre original) y responde 201 con ese rubro.
    if (existing) {
      Object.assign(existing, { active: true, updatedAt: new Date().toISOString() })
      return HttpResponse.json(existing, { status: 201 })
    }

    const now = new Date().toISOString()
    const created: Category = {
      id: categoriesDb.nextId++,
      name: body.name.trim(),
      active: true,
      createdAt: now,
      updatedAt: now,
    }
    categoriesDb.categories.push(created)
    // Responde 201 con el rubro directo, igual que el backend.
    return HttpResponse.json(created, { status: 201 })
  }),

  // 200 y no 201: el backend lo fuerza con @HttpCode(OK).
  http.post('/api/categories/:id/restore', ({ request, params }) => {
    const id = Number(params.id)
    const category = findCategory(id)
    if (!category) return notFound(request, id)
    Object.assign(category, { active: true, updatedAt: new Date().toISOString() })
    return HttpResponse.json(category)
  }),

  http.patch('/api/categories/:id', async ({ request, params }) => {
    const id = Number(params.id)
    const category = findCategory(id)
    if (!category) return notFound(request, id)
    if (!category.active) return apiError(request, 409, 'Debe reactivar el rubro antes de modificarlo')

    const body = (await request.json()) as CategoryInput
    const invalid = invalidName(request, body.name)
    if (invalid) return invalid
    // Como el backend: el nombre no puede ser el de otro rubro, activo o dado de baja.
    if (categoriesDb.categories.some((c) => c.id !== id && sameName(c.name, body.name))) {
      return apiError(request, 409, 'Ya existe un rubro con ese nombre')
    }
    Object.assign(category, { name: body.name.trim(), updatedAt: new Date().toISOString() })
    return HttpResponse.json(category)
  }),

  http.delete('/api/categories/:id', ({ request, params }) => {
    const id = Number(params.id)
    const category = findCategory(id)
    if (!category) return notFound(request, id)

    const inUse = activeFactoriesOf(id)
    if (inUse.length > 0) {
      // ConflictException({ message, factories }) pasado por AllExceptionsFilter.
      return apiError(
        request,
        409,
        `No es posible dar de baja el rubro: existen ${inUse.length} fábricas activas asociadas. Reasignelas antes de continuar`,
        { extra: { factories: inUse.map((f) => ({ id: Number(f.id), name: f.name })) } },
      )
    }
    // Baja lógica: el rubro queda, con active: false, y deja de listarse.
    Object.assign(category, { active: false, updatedAt: new Date().toISOString() })
    return new HttpResponse(null, { status: 204 })
  }),
]
