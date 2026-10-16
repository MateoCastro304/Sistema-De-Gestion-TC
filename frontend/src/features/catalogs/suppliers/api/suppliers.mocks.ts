import { http, HttpResponse, delay } from 'msw'
import { cuitError, formatCuit } from '@/shared/lib/cuit'
import { apiError } from '@/shared/mocks/errors'
import { db } from './suppliers.db'
import { SUPPLIER_TYPES } from '../types/supplier'
import type {
    SupplierCreate,
    SupplierType,
    SupplierUpdate,
} from '../types/supplier'

/**
 * MSW handlers que reemplazan al módulo de proveedores del backend
 * (`backend/src/suppliers`): mismas validaciones, mismos códigos y la misma
 * forma de los datos (CUIT con guiones, mail en minúsculas, teléfono sin
 * separadores). Los `delay` están para ver los estados de carga.
 */

const BASE = '/api/suppliers'

function notFound(request: Request, id: number) {
  return apiError(request, 404, `Supplier with id ${id} not found`, { extra: { id } })
}

/**
 * 409 de unicidad con la forma del backend real (DomainErrorFilter): manda
 * `field` y `value` para que el formulario marque el campo que chocó.
 */
function conflict(request: Request, field: 'cuit' | 'legalName', value: string) {
  return apiError(request, 409, `Supplier with ${field} "${value}" already exists`, { extra: { field, value } })
}

/** Las únicas claves que acepta el PATCH; cualquier otra es un 400. */
const UPDATABLE_FIELDS = ['legalName', 'cuit', 'contactName', 'contactEmail', 'contactPhone', 'address', 'observation']

/** Los opcionales que el PATCH deja borrar mandando null. */
const CLEARABLE_FIELDS = ['cuit', 'contactName', 'contactEmail', 'contactPhone', 'address', 'observation'] as const

/** Tope de `limit`, igual al de ListSuppliersQueryDto. */
const MAX_LIMIT = 100

/** Mismo criterio que shared/domain/mail.ts del backend. */
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Normalized = Partial<Record<(typeof CLEARABLE_FIELDS)[number], string>>

/**
 * Valida y deja cada opcional como lo guarda el backend. Vacío o null es
 * "sin dato" (undefined). Devuelve el 400 si algún valor no pasa la
 * validación de dominio (Cuit, Mail, Phone).
 */
function normalizeOptionals(request: Request, body: SupplierUpdate): Normalized | Response {
  const result: Normalized = {}
  for (const field of CLEARABLE_FIELDS) {
    const value = body[field]?.trim()
    if (!value) continue
    if (field === 'cuit') {
      if (cuitError(value)) return apiError(request, 400, 'CUIT check digit is invalid')
      result.cuit = formatCuit(value)
    } else if (field === 'contactEmail') {
      if (!MAIL_RE.test(value)) return apiError(request, 400, 'Invalid email format')
      result.contactEmail = value.toLowerCase()
    } else if (field === 'contactPhone') {
      const digits = value.replace(/^\+/, '').replace(/[\s\-.()]/g, '')
      if (!/^\d{8,15}$/.test(digits)) return apiError(request, 400, 'Phone must have between 8 and 15 digits')
      result.contactPhone = `${value.startsWith('+') ? '+' : ''}${digits}`
    } else {
      result[field] = value
    }
  }
  return result
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
      return apiError(request, 400, 'page must not be less than 1')
    }
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
      return apiError(request, 400, `limit must not be greater than ${MAX_LIMIT}`)
    }
    if (type && !SUPPLIER_TYPES.includes(type)) {
      return apiError(request, 400, 'type must be one of the supplier types')
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

  http.get(`${BASE}/:id`, async ({ request, params }) => {
    await delay(300)
    const id = Number(params.id)
    const supplier = db.suppliers.find((s) => s.id === id)
    // Un proveedor inactivo se responde igual que uno inexistente: 404.
    if (!supplier || !supplier.active) return notFound(request, id)
    return HttpResponse.json(supplier)
  }),

  http.post(BASE, async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as SupplierCreate

    // El `?.` aunque el tipo diga que vienen siempre: el body llega de la red
    // y el tipo es una promesa, no una garantia de runtime.
    if (!body.legalName?.trim() || !SUPPLIER_TYPES.includes(body.supplierType)) {
      return apiError(request, 400, 'legalName y supplierType son obligatorios.')
    }
    const optionals = normalizeOptionals(request, body)
    if (optionals instanceof Response) return optionals

    const legalName = body.legalName.trim()
    if (isLegalNameTaken(legalName)) return conflict(request, 'legalName', legalName)
    // Solo si vino un CUIT: sin CUIT no hay unicidad que verificar, y sin este
    // `if` dos proveedores sin CUIT chocarian entre si (undefined === undefined).
    if (optionals.cuit && isCuitTaken(optionals.cuit)) return conflict(request, 'cuit', optionals.cuit)

    const now = new Date().toISOString()
    const created = {
      ...optionals,
      legalName,
      supplierType: body.supplierType,
      id: db.nextId++,
      active: true,
      createdAt: now,
      updatedAt: now,
    }
    db.suppliers.push(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch(`${BASE}/:id`, async ({ request, params }) => {
    await delay(500)
    const id = Number(params.id)
    const index = db.suppliers.findIndex((s) => s.id === id)
    // Igual que el GET y el DELETE: un proveedor dado de baja no se edita.
    if (index === -1 || !db.suppliers[index].active) return notFound(request, id)

    const body = (await request.json()) as SupplierUpdate

    // El backend corre con forbidNonWhitelisted: una clave que no conoce
    // (supplierType, active) rechaza el PATCH entero en vez de ignorarla.
    const unknown = Object.keys(body).find((key) => !UPDATABLE_FIELDS.includes(key))
    if (unknown) return apiError(request, 400, `property ${unknown} should not exist`)

    // `'x' in body` y no `body.x`: distingue "no lo mandaron" de "lo mandaron
    // vacio", que en un PATCH parcial son dos intenciones distintas.
    if ('legalName' in body && !body.legalName?.trim()) {
      return apiError(request, 400, 'La razon social no puede quedar vacia.')
    }
    if (body.legalName && isLegalNameTaken(body.legalName, id)) {
      return conflict(request, 'legalName', body.legalName.trim())
    }

    const optionals = normalizeOptionals(request, body)
    if (optionals instanceof Response) return optionals
    // El CUIT es editable, asi que el PATCH necesita el mismo control de
    // unicidad que el POST.
    if (optionals.cuit && isCuitTaken(optionals.cuit, id)) return conflict(request, 'cuit', optionals.cuit)

    const updated = { ...db.suppliers[index], updatedAt: new Date().toISOString() }
    if (body.legalName) updated.legalName = body.legalName.trim()
    // null significa "borrar el dato". La respuesta omite los opcionales
    // vacios en vez de mandarlos en null, igual que el backend.
    for (const field of CLEARABLE_FIELDS) {
      if (!(field in body)) continue
      const value = optionals[field]
      if (value) updated[field] = value
      else delete updated[field]
    }
    db.suppliers[index] = updated
    return HttpResponse.json(updated)
  }),

  /** Baja logica: marca active=false, no saca la fila del array. */
  http.delete(`${BASE}/:id`, async ({ request, params }) => {
    await delay(400)
    const id = Number(params.id)
    const supplier = db.suppliers.find((s) => s.id === id)
    if (!supplier || !supplier.active) return notFound(request, id)
    supplier.active = false
    supplier.updatedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),
]
