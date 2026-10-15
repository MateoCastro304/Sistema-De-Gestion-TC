import { http, HttpResponse } from 'msw'
import type { Category, CategoryInput } from '../types/category'

/**
 * MSW handlers that stand in for the backend's `Categories` module while it is
 * not wired up. They implement `docs/openapi/paths/categories*.yaml`, including
 * the 409 answers the screen has to surface. Data lives in memory and resets on
 * every page reload.
 *
 * Donde el contrato y el backend difieren, copian al backend (baja lógica,
 * `active`, mensajes de los 409). Ver `docs/rubros-desvios-contrato.md`.
 */

const SEED_DATE = '2026-08-01T12:00:00Z'

let nextId = 1
const seed = (name: string, active = true): Category => ({
  id: nextId++,
  name,
  active,
  createdAt: SEED_DATE,
  updatedAt: SEED_DATE,
})

let categories: Category[] = [
  seed('Particular'),
  seed('Metalúrgica'),
  seed('Autopartes'),
  seed('Agroindustria'),
  seed('Petróleo y gas'),
  // Dado de baja: crear "Fundición" lo reactiva.
  seed('Fundición', false),
]

/**
 * Rubros que usa alguna fábrica activa del mock de Fábricas (Autopartes y
 * Petróleo y gas): darlos de baja responde 409, como el backend.
 */
const IN_USE_IDS = new Set([3, 5])

function findCategory(id: number): Category | undefined {
  return categories.find((c) => c.id === id)
}

function nameTaken(name: string, exceptId?: number): boolean {
  const normalized = name.trim().toLocaleLowerCase()
  return categories.some(
    (c) => c.id !== exceptId && c.name.toLocaleLowerCase() === normalized,
  )
}

function conflict(message: string, path: string) {
  return HttpResponse.json(
    {
      statusCode: 409,
      error: 'Conflict',
      message,
      path,
      timestamp: new Date().toISOString(),
    },
    { status: 409 },
  )
}

export const categoryHandlers = [
  http.get('/api/categories', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? 1)
    const limit = Number(url.searchParams.get('limit') ?? 20)
    const start = (page - 1) * limit
    // Como el backend: sólo los activos.
    const active = categories.filter((c) => c.active !== false)
    return HttpResponse.json(active.slice(start, start + limit))
  }),

  http.get('/api/categories/:id', ({ params }) => {
    const category = findCategory(Number(params.id))
    if (!category) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(category)
  }),

  http.post('/api/categories', async ({ request }) => {
    const body = (await request.json()) as CategoryInput
    const wanted = body.name.trim().toLocaleLowerCase()
    const existing = categories.find((c) => c.name.toLocaleLowerCase() === wanted)
    // Como el backend: si es de un rubro dado de baja, el 409 trae su id.
    if (existing && existing.active === false) {
      return HttpResponse.json(
        {
          statusCode: 409,
          error: 'Conflict',
          message: 'El rubro existe pero está dado de baja',
          categoryId: existing.id,
          path: '/api/categories',
          timestamp: new Date().toISOString(),
        },
        { status: 409 },
      )
    }
    if (existing) {
      return conflict('Ya existe un rubro con ese nombre', '/api/categories')
    }
    const now = new Date().toISOString()
    const created: Category = {
      id: nextId++,
      name: body.name,
      active: true,
      createdAt: now,
      updatedAt: now,
    }
    categories = [...categories, created]
    // El rubro directo, igual que el backend real.
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch('/api/categories/:id/restore', ({ params }) => {
    const category = findCategory(Number(params.id))
    if (!category) return new HttpResponse(null, { status: 404 })
    Object.assign(category, { active: true, updatedAt: new Date().toISOString() })
    return HttpResponse.json(category)
  }),

  http.patch('/api/categories/:id', async ({ params, request }) => {
    const id = Number(params.id)
    const category = findCategory(id)
    if (!category) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as CategoryInput
    if (nameTaken(body.name, id)) {
      return conflict(
        `Ya existe un rubro llamado "${body.name}".`,
        `/api/categories/${id}`,
      )
    }
    Object.assign(category, body, { updatedAt: new Date().toISOString() })
    return HttpResponse.json(category)
  }),

  http.delete('/api/categories/:id', ({ params }) => {
    const id = Number(params.id)
    if (!findCategory(id)) return new HttpResponse(null, { status: 404 })
    if (IN_USE_IDS.has(id)) {
      return conflict(
        'No es posible dar de baja el rubro: existen 1 fábricas activas asociadas. Reasignelas antes de continuar',
        `/api/categories/${id}`,
      )
    }
    // Baja lógica: el rubro queda, con active: false, y deja de listarse.
    Object.assign(findCategory(id)!, { active: false, updatedAt: new Date().toISOString() })
    return new HttpResponse(null, { status: 204 })
  }),
]
