import { http, HttpResponse } from 'msw'
import { normalizeText } from '@/shared/lib/normalizeText'
import { formatCuit } from '../schemas/factory.schema'
import type { Customer, CustomerInput } from '../types/customer'
import type { Factory, FactoryInput } from '../types/factory'

/**
 * MSW handlers that stand in for the backend while it is not ready. They
 * implement the same contract as the real API: contacts (EncargadoCliente) and
 * their factories (FabricaCliente). Los rubros los mockea el feature de
 * categorías (`/api/categories`). Data lives in memory and resets on every page
 * reload.
 */

/** El factoryId viaja en la URL, no en el cuerpo. */
type CustomerBody = Omit<CustomerInput, 'factoryId'>

// categoryId: ids de los rubros del mock de categorías ('3' Autopartes, '5' Petróleo y gas).
let factories: Factory[] = [
  {
    id: '1',
    name: 'EDASA',
    cuit: '30712345671',
    address: 'Av. Siempre Viva 123, Córdoba',
    payMethod:
      'Cliente puntual con los pagos, suele abonar por transferencia a 30 días.',
    categoryId: '3',
    isActive: true,
  },
  {
    id: '2',
    name: 'OxyCAM',
    cuit: '30798765430',
    address: 'Ruta 9 Km 7, Córdoba',
    payMethod: 'Casi siempre paga adelantado. Pedir seña en trabajos grandes.',
    categoryId: '5',
    isActive: true,
  },
]

function nextFactoryId(): string {
  const maxId = factories.reduce((max, f) => Math.max(max, Number(f.id)), 0)
  return String(maxId + 1)
}

/**
 * Enforces the "CUIT único" rule (CU-58, escenario 2). Returns a 409 response
 * when the payload collides with an existing factory, skipping the factory
 * being edited (`ignoreId`); otherwise `null`.
 */
function factoryConflict(
  input: FactoryInput,
  ignoreId?: string,
): Response | null {
  const cuit = input.cuit.replace(/\D/g, '')
  const clash = factories.find((f) => f.id !== ignoreId && f.cuit === cuit)
  if (!clash) return null
  return HttpResponse.json(
    {
      statusCode: 409,
      message: `Ya existe una fábrica registrada con ese CUIT ${formatCuit(cuit)}.`,
    },
    { status: 409 },
  )
}

// `id` is a per-factory counter (DB `manager_customer(factory_id, id)`): it
// restarts from 1 for each factory, so two managers in different factories can
// share id '1'. A manager is identified by the (factoryId, id) pair.
let customers: Customer[] = [
  {
    id: '1',
    firstName: 'Laura',
    lastName: 'Gómez',
    phone: '+54 351 555-0001',
    mail: 'compras@edasa.com',
    factoryId: '1',
    isActive: true,
  },
  {
    id: '1',
    firstName: 'Martín',
    lastName: 'Pérez',
    phone: '+54 351 555-0002',
    mail: 'pedidos@oxycam.com',
    factoryId: '2',
    isActive: true,
  },
]

/**
 * Enforces "el mail debe ser único dentro de la fábrica". Compares
 * case-insensitively, ignores empty mails (el mail es opcional) and the manager
 * being edited (`ignoreId`). Returns a 409 response on collision; otherwise
 * `null`.
 */
function mailConflict(
  factoryId: string,
  mail: string,
  ignoreId?: string,
): Response | null {
  const normalized = mail.trim().toLowerCase()
  if (normalized === '') return null
  const clash = customers.find(
    (c) =>
      c.factoryId === factoryId &&
      c.id !== ignoreId &&
      c.mail.trim().toLowerCase() === normalized,
  )
  if (!clash) return null
  return HttpResponse.json(
    {
      statusCode: 409,
      message: 'Ya existe un encargado con ese correo en esta fábrica',
    },
    { status: 409 },
  )
}

function findCustomer(factoryId: string, id: string): Customer | undefined {
  return customers.find((c) => c.factoryId === factoryId && c.id === id)
}

/**
 * Next per-factory manager id, mirroring the DB trigger `fn_gen_id_manager`
 * (`MAX(id) + 1` scoped to the factory).
 */
function nextCustomerId(factoryId: string): string {
  const maxId = customers
    .filter((c) => c.factoryId === factoryId)
    .reduce((max, c) => Math.max(max, Number(c.id)), 0)
  return String(maxId + 1)
}

function findFactory(id: string): Factory | undefined {
  return factories.find((f) => f.id === id)
}

export const customerHandlers = [
  // Customers (EncargadoCliente) ------------------------------------------
  // Item operations are nested under the owning factory because a manager is
  // identified by the composite key (factoryId, id); `/customers` stays as the
  // flat global list only.
  http.get('/api/customers', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '20')
    const factoryId = url.searchParams.get('factoryId')
    const nameContains = normalizeText(url.searchParams.get('nameContains')?.trim() ?? '')
    const activeParam = url.searchParams.get('active')

    let result = customers
    if (factoryId) result = result.filter((c) => c.factoryId === factoryId)
    if (activeParam !== null) {
      const active = activeParam === 'true'
      result = result.filter((c) => c.isActive === active)
    }
    // nameContains busca por nombre o apellido (como el backend).
    if (nameContains) {
      result = result.filter((c) =>
        normalizeText(`${c.firstName} ${c.lastName}`).includes(nameContains),
      )
    }
    const total = result.length
    const start = (page - 1) * limit
    const items = result.slice(start, start + limit)
    return HttpResponse.json({ items, total, page, limit })
  }),

  http.get('/api/factories/:factoryId/customers/:id', ({ params }) => {
    const customer = findCustomer(String(params.factoryId), String(params.id))
    if (!customer) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(customer)
  }),

  http.post('/api/factories/:factoryId/customers', async ({ params, request }) => {
    const factoryId = String(params.factoryId)
    const body = (await request.json()) as CustomerBody
    // Regla: un encargado se asocia a una fábrica activa (FK a Fábrica activa).
    const factory = findFactory(factoryId)
    if (!factory || !factory.isActive) {
      return HttpResponse.json(
        {
          statusCode: 409,
          message: 'La fábrica no existe o está inactiva.',
        },
        { status: 409 },
      )
    }
    const conflict = mailConflict(factoryId, body.mail)
    if (conflict) return conflict
    const newCustomer: Customer = {
      ...body,
      factoryId,
      id: nextCustomerId(factoryId),
      isActive: true,
    }
    customers = [...customers, newCustomer]
    return HttpResponse.json(newCustomer, { status: 201 })
  }),

  // Must precede the generic ":id" PATCH so the extra path segment is not
  // mistaken for an id. Both answer 204 No Content, like the backend.
  http.patch(
    '/api/factories/:factoryId/customers/:id/deactivate',
    ({ params }) => {
      const customer = findCustomer(String(params.factoryId), String(params.id))
      if (!customer) return new HttpResponse(null, { status: 404 })
      customer.isActive = false
      return new HttpResponse(null, { status: 204 })
    },
  ),

  http.patch(
    '/api/factories/:factoryId/customers/:id/activate',
    ({ params }) => {
      const customer = findCustomer(String(params.factoryId), String(params.id))
      if (!customer) return new HttpResponse(null, { status: 404 })
      customer.isActive = true
      return new HttpResponse(null, { status: 204 })
    },
  ),

  http.patch(
    '/api/factories/:factoryId/customers/:id',
    async ({ params, request }) => {
      const customer = findCustomer(String(params.factoryId), String(params.id))
      if (!customer) return new HttpResponse(null, { status: 404 })
      const body = (await request.json()) as CustomerBody
      const conflict = mailConflict(customer.factoryId, body.mail, customer.id)
      if (conflict) return conflict
      // Keep the composite identity fixed; only mutable fields change.
      Object.assign(customer, body, {
        id: customer.id,
        factoryId: customer.factoryId,
      })
      return HttpResponse.json(customer)
    },
  ),

  // Factories (FabricaCliente) --------------------------------------------
  // Paginado, como el backend: { items, total, page, limit }.
  http.get('/api/factories', ({ request }) => {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get('page') ?? '1')
    const limit = Number(url.searchParams.get('limit') ?? '20')
    const start = (page - 1) * limit
    return HttpResponse.json({
      items: factories.slice(start, start + limit),
      total: factories.length,
      page,
      limit,
    })
  }),

  http.post('/api/factories', async ({ request }) => {
    const body = (await request.json()) as FactoryInput
    const conflict = factoryConflict(body)
    if (conflict) return conflict
    const newFactory: Factory = {
      id: nextFactoryId(),
      isActive: true,
      ...body,
    }
    factories = [...factories, newFactory]
    return HttpResponse.json(newFactory, { status: 201 })
  }),

  http.patch('/api/factories/:id', async ({ params, request }) => {
    const factory = findFactory(String(params.id))
    if (!factory) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as FactoryInput
    const conflict = factoryConflict(body, factory.id)
    if (conflict) return conflict
    Object.assign(factory, body)
    return HttpResponse.json(factory)
  }),
]
