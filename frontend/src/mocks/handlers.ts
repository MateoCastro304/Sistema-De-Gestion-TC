import { http, HttpResponse, delay } from 'msw'
import { db } from './db'
import type {
    SupplierCreate,
    SupplierUpdate,
} from '@/features/catalogs/suppliers/types/supplier'

const BASE = '/api/suppliers'

/** Error con la forma de components/schemas/Error.yaml. */
function apiError(status: number, error: string, message: string, path: string) {
  return HttpResponse.json(
    { statusCode: status, error, message, path, timestamp: new Date().toISOString() },
    { status },
  )
}

/**
 * El CUIT es opcional: "no vino" y "vino vacio" significan lo mismo y se
 * guardan como undefined. Sin esta normalizacion quedarian las dos formas
 * conviviendo en la base y las comparaciones de unicidad fallarian.
 */
function normalizeCuit(value: string | undefined): string | undefined {
  const cuit = value?.trim()
  return cuit ? cuit : undefined
}

/**
 * Unicidad del CUIT. `exceptId` deja afuera al propio proveedor: sin eso,
 * guardar una edicion sin tocar el CUIT chocaria consigo mismo.
 *
 * Mira todas las filas, incluidas las dadas de baja: un indice UNIQUE de la
 * base tampoco distingue, y el registro dado de baja sigue ocupando su CUIT.
 */
function isCuitTaken(cuit: string, exceptId?: number) {
  return db.suppliers.some((s) => s.cuit === cuit && s.id !== exceptId)
}

export const handlers = [
  // La baja es logica, pero el eliminado no se lista ni se puede pedir por id:
  // el registro sobrevive en la base solo para no romper el historial.
  http.get(BASE, async () => {
    await delay(400) // para ver el estado de carga de verdad
    return HttpResponse.json(db.suppliers.filter((s) => s.active))
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
    if (!body.legalName?.trim() || !body.supplierType) {
      return apiError(
        400,
        'Bad Request',
        'legalName y supplierType son obligatorios.',
        BASE,
      )
    }

    const cuit = normalizeCuit(body.cuit)

    // Solo si vino un CUIT: sin CUIT no hay unicidad que verificar, y sin este
    // `if` dos proveedores sin CUIT chocarian entre si (undefined === undefined).
    if (cuit && isCuitTaken(cuit)) {
      return apiError(409, 'Conflict', `Ya existe un proveedor con el CUIT ${cuit}.`, BASE)
    }

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
    const patch: SupplierUpdate = { ...body }

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

    // El CUIT ahora es editable, asi que el PATCH necesita el mismo control de
    // unicidad que el POST. Un cuit vacio significa "borrar el CUIT".
    if ('cuit' in body) {
      const cuit = normalizeCuit(body.cuit)
      if (cuit && isCuitTaken(cuit, id)) {
        return apiError(
          409,
          'Conflict',
          `Ya existe un proveedor con el CUIT ${cuit}.`,
          `${BASE}/${id}`,
        )
      }
      patch.cuit = cuit
    }

    const updated = { ...db.suppliers[index], ...patch, updatedAt: new Date().toISOString() }
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
