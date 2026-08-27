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

export const handlers = [
  http.get(BASE, async () => {
    await delay(400) // para ver el estado de carga de verdad
    return HttpResponse.json(db.suppliers)
  }),

  http.get(`${BASE}/:id`, async ({ params }) => {
    await delay(300)
    const id = Number(params.id)
    const supplier = db.suppliers.find((s) => s.id === id)
    if (!supplier) {
      return apiError(404, 'Not Found', `Supplier with id ${id} was not found.`, `${BASE}/${id}`)
    }
    return HttpResponse.json(supplier)
  }),

  http.post(BASE, async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as SupplierCreate

    if (db.suppliers.some((s) => s.taxId === body.taxId)) {
      return apiError(409, 'Conflict', `Ya existe un proveedor con el CUIT ${body.taxId}.`, BASE)
    }

    const now = new Date().toISOString()
    const created = { ...body, id: db.nextId++, active: true, createdAt: now, updatedAt: now }
    db.suppliers.push(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  http.patch(`${BASE}/:id`, async ({ params, request }) => {
    await delay(500)
    const id = Number(params.id)
    const index = db.suppliers.findIndex((s) => s.id === id)
    if (index === -1) {
      return apiError(404, 'Not Found', `Supplier with id ${id} was not found.`, `${BASE}/${id}`)
    }
    const body = (await request.json()) as SupplierUpdate
    const updated = { ...db.suppliers[index], ...body, updatedAt: new Date().toISOString() }
    db.suppliers[index] = updated
    return HttpResponse.json(updated)
  }),

  /** Baja lógica: marca active=false, no saca la fila del array. */
  http.delete(`${BASE}/:id`, async ({ params }) => {
    await delay(400)
    const id = Number(params.id)
    const supplier = db.suppliers.find((s) => s.id === id)
    if (!supplier) {
      return apiError(404, 'Not Found', `Supplier with id ${id} was not found.`, `${BASE}/${id}`)
    }
    supplier.active = false
    supplier.updatedAt = new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),
]
