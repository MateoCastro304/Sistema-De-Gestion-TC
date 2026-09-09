import { http, HttpResponse } from 'msw'
import type { Customer, CustomerInput } from '../types/customer'
import type { Factory, FactoryInput } from '../types/factory'
import type { Industry, IndustryInput } from '../types/industry'

/**
 * MSW handlers that stand in for the backend (DTC-54) while it is not ready.
 * They implement the contract proposed in `docs/openapi/customers.yaml` so the
 * frontend can be built and demoed end to end: contacts (EncargadoCliente),
 * their factories (FabricaCliente) and rubros (Industry). Data lives in memory
 * and resets on every page reload.
 */

let industries: Industry[] = [
  { id: 'ind-particular', name: 'Particular', isActive: true },
  { id: 'ind-metal', name: 'Metalúrgica', isActive: true },
  { id: 'ind-auto', name: 'Autopartes', isActive: true },
  { id: 'ind-agro', name: 'Agroindustria', isActive: true },
  { id: 'ind-oil', name: 'Petróleo y gas', isActive: true },
]

let factories: Factory[] = [
  {
    id: 'fac-edasa',
    name: 'EDASA',
    code: 'EDA',
    cuit: '30712345671',
    address: 'Av. Siempre Viva 123, Córdoba',
    payMethod:
      'Cliente puntual con los pagos, suele abonar por transferencia a 30 días.',
    industryId: 'ind-auto',
    isActive: true,
  },
  {
    id: 'fac-oxycam',
    name: 'OxyCAM',
    code: 'OXY',
    cuit: '30798765430',
    address: 'Ruta 9 Km 7, Córdoba',
    payMethod: 'Casi siempre paga adelantado. Pedir seña en trabajos grandes.',
    industryId: 'ind-oil',
    isActive: true,
  },
]

/**
 * Enforces the "CUIT y código de fábrica son únicos" rule (CU-58, escenario 2).
 * Returns a 409 response when the payload collides with an existing factory,
 * skipping the factory being edited (`ignoreId`); otherwise `null`.
 */
function factoryConflict(
  input: FactoryInput,
  ignoreId?: string,
): Response | null {
  const code = input.code.trim().toUpperCase()
  const cuit = input.cuit.replace(/\D/g, '')
  const clash = factories.find(
    (f) =>
      f.id !== ignoreId &&
      (f.cuit === cuit || f.code.toUpperCase() === code),
  )
  if (!clash) return null
  const field = clash.cuit === cuit ? `CUIT ${input.cuit}` : `código "${code}"`
  return HttpResponse.json(
    {
      statusCode: 409,
      message: `Ya existe una fábrica registrada con ese ${field}.`,
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
    hasWhatsapp: true,
    mail: 'compras@edasa.com',
    observation: '',
    factoryId: 'fac-edasa',
    isActive: true,
  },
  {
    id: '1',
    firstName: 'Martín',
    lastName: 'Pérez',
    phone: '+54 351 555-0002',
    hasWhatsapp: false,
    mail: 'pedidos@oxycam.com',
    observation: '',
    factoryId: 'fac-oxycam',
    isActive: true,
  },
]

/**
 * Enforces "el mail debe ser único dentro de la fábrica" (HU encargados,
 * escenario 2). Compares case-insensitively, ignores empty mails (el mail es
 * condicional) and the manager being edited (`ignoreId`). Returns a 409
 * response on collision; otherwise `null`.
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
  http.get('/api/customers', () => HttpResponse.json(customers)),

  http.get('/api/factories/:factoryId/customers/:id', ({ params }) => {
    const customer = findCustomer(String(params.factoryId), String(params.id))
    if (!customer) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(customer)
  }),

  http.post('/api/factories/:factoryId/customers', async ({ params, request }) => {
    const factoryId = String(params.factoryId)
    const body = (await request.json()) as CustomerInput
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
  // mistaken for an id.
  http.patch(
    '/api/factories/:factoryId/customers/:id/deactivate',
    ({ params }) => {
      const customer = findCustomer(String(params.factoryId), String(params.id))
      if (!customer) return new HttpResponse(null, { status: 404 })
      customer.isActive = false
      return HttpResponse.json(customer)
    },
  ),

  http.patch(
    '/api/factories/:factoryId/customers/:id',
    async ({ params, request }) => {
      const customer = findCustomer(String(params.factoryId), String(params.id))
      if (!customer) return new HttpResponse(null, { status: 404 })
      const body = (await request.json()) as CustomerInput
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
  http.get('/api/factories', () => HttpResponse.json(factories)),

  http.post('/api/factories', async ({ request }) => {
    const body = (await request.json()) as FactoryInput
    const conflict = factoryConflict(body)
    if (conflict) return conflict
    const newFactory: Factory = {
      id: crypto.randomUUID(),
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

  // Industries (Rubro) ----------------------------------------------------
  http.get('/api/industries', () => HttpResponse.json(industries)),

  http.post('/api/industries', async ({ request }) => {
    const body = (await request.json()) as IndustryInput
    const newIndustry: Industry = {
      id: crypto.randomUUID(),
      isActive: true,
      ...body,
    }
    industries = [...industries, newIndustry]
    return HttpResponse.json(newIndustry, { status: 201 })
  }),
]
