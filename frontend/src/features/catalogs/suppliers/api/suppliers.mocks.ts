import { http, HttpResponse, delay } from 'msw'
import { db } from './suppliers.db'
import { SUPPLIER_TYPES } from '../types/supplier'
import type {
    SupplierCreate,
    SupplierType,
    SupplierUpdate,
} from '../types/supplier'

const BASE = '/api/suppliers'

/** Error con la forma de components/schemas/Error.yaml. */
function apiError(status: number, error: string, message: string, path: string) {
  return HttpResponse.json(
    { statusCode: status, error, message, path, timestamp: new Date().toISOString() },
    { status },
  )
}

/**
 * 409 de unicidad con la forma del backend real (DomainErrorFilter): manda
 * `field` y `value` para que el formulario marque el campo que chocó.
 */
function conflict(field: 'cuit' | 'legalName', value: string) {
  return HttpResponse.json(
    {
      statusCode: 409,
      error: 'Conflict',
      message: `Supplier with ${field} "${value}" already exists`,
      field,
      value,
    },
    { status: 409 },
  )
}

/** Las únicas claves que acepta el PATCH; cualquier otra es un 400. */
const UPDATABLE_FIELDS = ['legalName', 'cuit', 'contactName', 'contactEmail', 'contactPhone', 'address', 'observation']

/** Los opcionales que el PATCH deja borrar mandando null. */
const CLEARABLE_FIELDS = ['cuit', 'contactName', 'contactEmail', 'contactPhone', 'address', 'observation'] as const

/** Tope de `limit`, igual al de ListSuppliersQueryDto. */
const MAX_LIMIT = 100

/**
 * El CUIT es opcional: "no vino" y "vino vacio" significan lo mismo y se
 * guardan como undefined. Sin esta normalizacion quedarian las dos formas
 * conviviendo en la base y las comparaciones de unicidad fallarian.
 */
function normalizeCuit(value: string | null | undefined): string | undefined {
  const cuit = value?.trim()
  return cuit ? cuit : undefined
}

/**
 * Unicidad del CUIT. `exceptId` deja afuera al propio proveedor: sin eso,
 * guardar una edicion sin tocar el CUIT chocaria consigo mismo.
 *
 * Mira sólo los activos: en el backend el indice es parcial, asi que un
 * proveedor dado de baja libera su CUIT y su razon social.
 */
function isCuitTaken(cuit: string, exceptId?: number) {
  return db.suppliers.some((s) => s.active && s.cuit === cuit && s.id !== exceptId)
}

/** Unicidad de la razón social, con las mismas reglas que la del CUIT. */
function isLegalNameTaken(legalName: string, exceptId?: number) {
  const name = legalName.trim().toLowerCase()
  return db.suppliers.some((s) => s.active && s.legalName.toLowerCase() === name && s.id !== exceptId)
}

export const supplierHandlers = [
  // La baja es logica, pero el eliminado no se lista ni se puede pedir por id:
  // el registro sobrevive en la base solo para no romper el historial.
  // Misma respuesta que el backend: busca, filtra por tipo, pagina y
  // devuelve { items, total, page, limit }.
  http.get(BASE, async ({ request }) => {
    await delay(400) // para ver el estado de carga de verdad
    const query = new URL(request.url).searchParams
    const page = Number(query.get('page') ?? 1)
    const limit = Number(query.get('limit') ?? 20)
    const type = query.get('type') as SupplierType | null

    if (!Number.isInteger(page) || page < 1) {
      return apiError(400, 'Bad Request', 'page must not be less than 1', BASE)
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return apiError(400, 'Bad Request', `limit must not be greater than ${MAX_LIMIT}`, BASE)
    }
    if (type && !SUPPLIER_TYPES.includes(type)) {
      return apiError(400, 'Bad Request', 'type must be one of the supplier types', BASE)
    }

    // search matchea razon social, contacto o CUIT (este, sin separadores).
    const search = query.get('search')?.trim().toLowerCase() ?? ''
    const digits = search.replace(/[\s\-.]/g, '')
    const matches = db.suppliers.filter((s) => {
      if (!s.active) return false
      if (type && s.supplierType !== type) return false
      if (!search) return true
      return (
        s.legalName.toLowerCase().includes(search) ||
        (s.contactName ?? '').toLowerCase().includes(search) ||
        (digits !== '' && (s.cuit ?? '').replace(/-/g, '').includes(digits))
      )
    })

    return HttpResponse.json({
      items: matches.slice((page - 1) * limit, page * limit),
      total: matches.length,
      page,
      limit,
    })
  }),

  http.get(`${BASE}/:id`, async ({ params }) => {
    await delay(300)
    const id = Number(params.id)
    const supplier = db.suppliers.find((s) => s.id === id)
    // Un proveedor inactivo se responde igual que uno inexistente: 404.
    if (!supplier || !supplier.active) {
      return apiError(404, 'Not Found', `Supplier with id ${id} was not found.`, `${BASE}/${id}`)
    }
    return HttpResponse.json(supplier)
  }),

  http.post(BASE, async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as SupplierCreate

    // El `?.` aunque el tipo diga que vienen siempre: el body llega de la red
    // y el tipo es una promesa, no una garantia de runtime.
    if (!body.legalName?.trim() || !SUPPLIER_TYPES.includes(body.supplierType)) {
      return apiError(
        400,
        'Bad Request',
        'legalName y supplierType son obligatorios.',
        BASE,
      )
    }

    if (isLegalNameTaken(body.legalName)) return conflict('legalName', body.legalName.trim())

    const cuit = normalizeCuit(body.cuit)

    // Solo si vino un CUIT: sin CUIT no hay unicidad que verificar, y sin este
    // `if` dos proveedores sin CUIT chocarian entre si (undefined === undefined).
    if (cuit && isCuitTaken(cuit)) return conflict('cuit', cuit)

    const now = new Date().toISOString()
    // `cuit` va despues del spread para pisar el del body con el normalizado.
    const created = {
      ...body,
      cuit,
      id: db.nextId++,
      active: true,
      createdAt: now,
      updatedAt: now,
    }
    db.suppliers.push(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch(`${BASE}/:id`, async ({ params, request }) => {
    await delay(500)
    const id = Number(params.id)
    const index = db.suppliers.findIndex((s) => s.id === id)
    // Igual que el GET y el DELETE: un proveedor dado de baja no se edita.
    if (index === -1 || !db.suppliers[index].active) {
      return apiError(404, 'Not Found', `Supplier with id ${id} was not found.`, `${BASE}/${id}`)
    }

    const body = (await request.json()) as SupplierUpdate

    // El backend corre con forbidNonWhitelisted: una clave que no conoce
    // (supplierType, active) rechaza el PATCH entero en vez de ignorarla.
    const unknown = Object.keys(body).find((key) => !UPDATABLE_FIELDS.includes(key))
    if (unknown) {
      return apiError(400, 'Bad Request', `property ${unknown} should not exist`, `${BASE}/${id}`)
    }

    // `'x' in body` y no `body.x`: distingue "no lo mandaron" de "lo mandaron
    // vacio", que en un PATCH parcial son dos intenciones distintas.
    if ('legalName' in body && !body.legalName?.trim()) {
      return apiError(
        400,
        'Bad Request',
        'La razon social no puede quedar vacia.',
        `${BASE}/${id}`,
      )
    }

    if (body.legalName && isLegalNameTaken(body.legalName, id)) {
      return conflict('legalName', body.legalName.trim())
    }

    // El CUIT es editable, asi que el PATCH necesita el mismo control de
    // unicidad que el POST.
    const cuit = normalizeCuit(body.cuit)
    if (cuit && isCuitTaken(cuit, id)) return conflict('cuit', cuit)

    const updated = { ...db.suppliers[index], updatedAt: new Date().toISOString() }
    if (body.legalName) updated.legalName = body.legalName.trim()
    // null significa "borrar el dato". La respuesta omite los opcionales
    // vacios en vez de mandarlos en null, igual que el backend.
    for (const field of CLEARABLE_FIELDS) {
      if (!(field in body)) continue
      const value = body[field]?.trim()
      if (value) updated[field] = value
      else delete updated[field]
    }
    db.suppliers[index] = updated
    return HttpResponse.json(updated)
  }),

  /** Baja logica: marca active=false, no saca la fila del array. */
  http.delete(`${BASE}/:id`, async ({ params }) => {
    await delay(400)
    const id = Number(params.id)
    const supplier = db.suppliers.find((s) => s.id === id)
    if (!supplier || !supplier.active) {
      return apiError(404, 'Not Found', `Supplier with id ${id} was not found.`, `${BASE}/${id}`)
    }
    supplier.active = false
    supplier.updatedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),
]
