import { http, HttpResponse } from 'msw'
import type { Customer, CustomerInput, Industry } from '../types/customer'

/**
 * MSW handlers that stand in for the backend (DTC-54) while it is not ready.
 * They implement the contract proposed in `docs/openapi/customers.yaml` so the
 * frontend can be built and demoed end to end. Data lives in memory and resets
 * on every page reload.
 */

const industries: Industry[] = [
  { id: 'ind-metal', name: 'Metalúrgica' },
  { id: 'ind-auto', name: 'Autopartes' },
  { id: 'ind-agro', name: 'Agroindustria' },
  { id: 'ind-oil', name: 'Petróleo y gas' },
]

let customers: Customer[] = [
  {
    id: '1',
    name: 'EDASA',
    personType: 'business',
    address: 'Av. Siempre Viva 123, Córdoba',
    phone: '+54 351 555-0001',
    emails: ['compras@edasa.com'],
    paymentDescription:
      'Cliente puntual con los pagos, suele abonar por transferencia a 30 días.',
    industryId: 'ind-auto',
    isActive: true,
  },
  {
    id: '2',
    name: 'OxyCAM',
    personType: 'business',
    address: 'Ruta 9 Km 7, Córdoba',
    phone: '+54 351 555-0002',
    emails: ['pedidos@oxycam.com', 'admin@oxycam.com'],
    paymentDescription: 'Casi siempre paga adelantado. Pedir seña en trabajos grandes.',
    industryId: 'ind-oil',
    isActive: true,
  },
]

function findById(id: string): Customer | undefined {
  return customers.find((c) => c.id === id)
}

export const customerHandlers = [
  http.get('/api/customers', () => HttpResponse.json(customers)),

  http.get('/api/customers/:id', ({ params }) => {
    const customer = findById(String(params.id))
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

  // Must be declared before the generic ":id" PATCH so the extra path segment
  // is not mistaken for an id.
  http.patch('/api/customers/:id/deactivate', ({ params }) => {
    const customer = findById(String(params.id))
    if (!customer) return new HttpResponse(null, { status: 404 })
    customer.isActive = false
    return HttpResponse.json(customer)
  }),

  http.patch('/api/customers/:id', async ({ params, request }) => {
    const customer = findById(String(params.id))
    if (!customer) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as CustomerInput
    Object.assign(customer, body)
    return HttpResponse.json(customer)
  }),

  http.get('/api/industries', () => HttpResponse.json(industries)),
]
