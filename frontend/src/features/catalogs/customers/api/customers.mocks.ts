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
    cuit: '30712345678',
    address: 'Av. Siempre Viva 123, Córdoba',
    paymentDescription:
      'Cliente puntual con los pagos, suele abonar por transferencia a 30 días.',
    industryId: 'ind-auto',
    isActive: true,
  },
  {
    id: 'fac-oxycam',
    name: 'OxyCAM',
    cuit: '30798765432',
    address: 'Ruta 9 Km 7, Córdoba',
    paymentDescription: 'Casi siempre paga adelantado. Pedir seña en trabajos grandes.',
    industryId: 'ind-oil',
    isActive: true,
  },
]

let customers: Customer[] = [
  {
    id: '1',
    firstName: 'Laura',
    lastName: 'Gómez',
    phone: '+54 351 555-0001',
    email: 'compras@edasa.com',
    factoryId: 'fac-edasa',
    isActive: true,
  },
  {
    id: '2',
    firstName: 'Martín',
    lastName: 'Pérez',
    phone: '+54 351 555-0002',
    email: 'pedidos@oxycam.com',
    factoryId: 'fac-oxycam',
    isActive: true,
  },
]

function findCustomer(id: string): Customer | undefined {
  return customers.find((c) => c.id === id)
}

function findFactory(id: string): Factory | undefined {
  return factories.find((f) => f.id === id)
}

export const customerHandlers = [
  // Customers (EncargadoCliente) ------------------------------------------
  http.get('/api/customers', () => HttpResponse.json(customers)),

  http.get('/api/customers/:id', ({ params }) => {
    const customer = findCustomer(String(params.id))
    if (!customer) return new HttpResponse(null, { status: 404 })
    return HttpResponse.json(customer)
  }),

  http.post('/api/customers', async ({ request }) => {
    const body = (await request.json()) as CustomerInput
    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      isActive: true,
      ...body,
    }
    customers = [...customers, newCustomer]
    return HttpResponse.json(newCustomer, { status: 201 })
  }),

  // Must precede the generic ":id" PATCH so the extra path segment is not
  // mistaken for an id.
  http.patch('/api/customers/:id/deactivate', ({ params }) => {
    const customer = findCustomer(String(params.id))
    if (!customer) return new HttpResponse(null, { status: 404 })
    customer.isActive = false
    return HttpResponse.json(customer)
  }),

  http.patch('/api/customers/:id', async ({ params, request }) => {
    const customer = findCustomer(String(params.id))
    if (!customer) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as CustomerInput
    Object.assign(customer, body)
    return HttpResponse.json(customer)
  }),

  // Factories (FabricaCliente) --------------------------------------------
  http.get('/api/factories', () => HttpResponse.json(factories)),

  http.post('/api/factories', async ({ request }) => {
    const body = (await request.json()) as FactoryInput
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
