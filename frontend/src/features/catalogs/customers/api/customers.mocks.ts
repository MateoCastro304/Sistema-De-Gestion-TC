import { http, HttpResponse } from 'msw'
import { normalizeText } from '@/shared/lib/normalizeText'
import { cuitDigits, cuitError } from '@/shared/lib/cuit'
import { apiError } from '@/shared/mocks/errors'
import { PAGE_LIMIT_ERROR, paginate, readPageParams } from '@/shared/mocks/paging'
import { findCategory } from '@/features/catalogs/categories/api/categories.db'
import type { Customer, CustomerInput } from '../types/customer'
import type { Factory, FactoryInput } from '../types/factory'
import { customersDb, findFactory } from './customers.db'

/**
 * MSW handlers that stand in for the backend's customers and factory modules
 * (`backend/src/customers`, `backend/src/factory`): encargados (EncargadoCliente)
 * y sus fábricas (FabricaCliente). Mismas reglas, mismos códigos y mismos
 * mensajes que el backend, porque la pantalla traduce los 409 leyendo el
 * texto (`utils/errorMessages.ts`). Los rubros los mockea el feature de
 * categorías; acá sólo se lee su tabla para validar la fábrica.
 */

/** El factoryId viaja en la URL, no en el cuerpo. */
type CustomerBody = Partial<Omit<CustomerInput, 'factoryId'>>

/** Mismo criterio que shared/domain/mail.ts del backend. */
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Error de dominio (DomainValidationError): 400 con el campo en `details`. */
function invalid(request: Request, field: string, message: string) {
  return apiError(request, 400, message, { details: [{ field, message }] })
}

// Customers (EncargadoCliente) --------------------------------------------

function findCustomer(factoryId: string, id: string): Customer | undefined {
  return customersDb.customers.find((c) => c.factoryId === factoryId && c.id === id)
}

/** Next per-factory manager id, like the DB trigger `fn_gen_id_manager` (`MAX(id) + 1`). */
function nextCustomerId(factoryId: string): string {
  const maxId = customersDb.customers
    .filter((c) => c.factoryId === factoryId)
    .reduce((max, c) => Math.max(max, Number(c.id)), 0)
  return String(maxId + 1)
}

/**
 * Normaliza y valida los datos de contacto como `Customer.create` /
 * `Customer.update`: textos recortados, mail en minúsculas, teléfono sin
 * separadores (conserva el `+`) y al menos un medio de contacto.
 */
function toCustomerFields(
  request: Request,
  body: Required<CustomerBody>,
): Pick<Customer, 'firstName' | 'lastName' | 'phone' | 'mail'> | Response {
  const firstName = body.firstName?.trim() ?? ''
  if (!firstName) return invalid(request, 'firstName', 'Customer name cannot be empty')

  const mail = body.mail?.trim().toLowerCase() ?? ''
  if (mail && !MAIL_RE.test(mail)) return invalid(request, 'mail', 'Invalid email format')

  const rawPhone = body.phone?.trim() ?? ''
  const digits = rawPhone.replace(/^\+/, '').replace(/[\s\-.()]/g, '')
  if (rawPhone && !/^\d+$/.test(digits)) {
    return invalid(request, 'phone', 'Phone must contain only digits and separators')
  }
  if (rawPhone && (digits.length < 8 || digits.length > 15)) {
    return invalid(request, 'phone', 'Phone must have between 8 and 15 digits')
  }
  const phone = rawPhone ? `${rawPhone.startsWith('+') ? '+' : ''}${digits}` : ''

  if (!phone && !mail) {
    return invalid(request, 'phone', 'Customer must have at least one contact: phone or mail')
  }
  return { firstName, lastName: body.lastName?.trim() ?? '', phone, mail }
}

/** Mail único entre los encargados activos de la fábrica (sin distinguir mayúsculas). */
function mailTaken(factoryId: string, mail: string, exceptId?: string): boolean {
  if (!mail) return false
  return customersDb.customers.some(
    (c) => c.factoryId === factoryId && c.isActive && c.id !== exceptId && c.mail.toLowerCase() === mail,
  )
}

function customerNotFound(request: Request, factoryId: string, id: string) {
  return apiError(request, 404, `Customer ${id} not found in factory ${factoryId}`)
}

// Factories (FabricaCliente) ----------------------------------------------

function nextFactoryId(): string {
  const maxId = customersDb.factories.reduce((max, f) => Math.max(max, Number(f.id)), 0)
  return String(maxId + 1)
}

function factoryNotFound(request: Request, id: string) {
  return apiError(request, 404, `Factory with ID ${id} not found`)
}

/** Unicidad entre las fábricas activas, como el backend (`existsByCuit`, `existsByName`). */
function cuitTaken(cuit: string, exceptId?: string) {
  return customersDb.factories.some((f) => f.isActive && f.id !== exceptId && f.cuit === cuit)
}
function nameTaken(name: string, exceptId?: string) {
  const wanted = name.trim().toLowerCase()
  return customersDb.factories.some((f) => f.isActive && f.id !== exceptId && f.name.toLowerCase() === wanted)
}

/** El rubro tiene que existir y estar activo: si no, 400 (no 409). */
function categoryProblem(request: Request, categoryId: string | number | undefined) {
  const category = findCategory(Number(categoryId))
  if (category?.active) return null
  return apiError(request, 400, `Category with ID ${categoryId} not found or inactive`)
}

export const customerHandlers = [
  // Customers (EncargadoCliente) ------------------------------------------
  // Item operations are nested under the owning factory because a manager is
  // identified by the composite key (factoryId, id); `/customers` stays as the
  // flat global list only.
  http.get('/api/customers', ({ request }) => {
    const url = new URL(request.url)
    const pageParams = readPageParams(url)
    if (!pageParams) return apiError(request, 400, PAGE_LIMIT_ERROR)
    const factoryId = url.searchParams.get('factoryId')
    const nameContains = normalizeText(url.searchParams.get('nameContains')?.trim() ?? '')
    const activeParam = url.searchParams.get('active')

    let result = customersDb.customers
    if (factoryId) result = result.filter((c) => c.factoryId === factoryId)
    if (activeParam !== null) result = result.filter((c) => c.isActive === (activeParam === 'true'))
    // nameContains busca en el nombre o en el apellido (como el backend).
    if (nameContains) {
      result = result.filter(
        (c) => normalizeText(c.firstName).includes(nameContains) || normalizeText(c.lastName).includes(nameContains),
      )
    }
    // Mismo orden que el backend: por fábrica y después por id.
    const sorted = [...result].sort((a, b) => Number(a.factoryId) - Number(b.factoryId) || Number(a.id) - Number(b.id))
    return HttpResponse.json(paginate(sorted, pageParams))
  }),

  http.get('/api/factories/:factoryId/customers/:id', ({ request, params }) => {
    const factoryId = String(params.factoryId)
    const id = String(params.id)
    const customer = findCustomer(factoryId, id)
    if (!customer) return customerNotFound(request, factoryId, id)
    return HttpResponse.json(customer)
  }),

  http.post('/api/factories/:factoryId/customers', async ({ request, params }) => {
    const factoryId = String(params.factoryId)
    // Un encargado sólo se agrega a una fábrica que existe y está activa.
    const factory = findFactory(factoryId)
    if (!factory) return factoryNotFound(request, factoryId)
    if (!factory.isActive) return apiError(request, 409, `Factory with ID ${factoryId} is inactive`)

    const body = (await request.json()) as Required<CustomerBody>
    const fields = toCustomerFields(request, body)
    if (fields instanceof Response) return fields
    if (mailTaken(factoryId, fields.mail)) {
      return apiError(request, 409, `Customer with mail "${fields.mail}" already exists`)
    }

    const created: Customer = { ...fields, factoryId, id: nextCustomerId(factoryId), isActive: true }
    customersDb.customers.push(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  // Must precede the generic ":id" PATCH so the extra path segment is not
  // mistaken for an id. Answers 204 No Content, like the backend.
  http.patch('/api/factories/:factoryId/customers/:id/deactivate', ({ request, params }) => {
    const factoryId = String(params.factoryId)
    const id = String(params.id)
    const customer = findCustomer(factoryId, id)
    if (!customer) return customerNotFound(request, factoryId, id)
    if (!customer.isActive) {
      return apiError(request, 409, `Customer ${id} in factory ${factoryId} is already inactive`)
    }
    customer.isActive = false
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch('/api/factories/:factoryId/customers/:id', async ({ request, params }) => {
    const factoryId = String(params.factoryId)
    const id = String(params.id)
    const body = (await request.json()) as CustomerBody
    if (Object.values(body).every((value) => value === undefined)) {
      return apiError(request, 400, 'At least one field must be provided')
    }
    const customer = findCustomer(factoryId, id)
    if (!customer) return customerNotFound(request, factoryId, id)

    // PATCH parcial: lo que no vino se queda como estaba.
    const fields = toCustomerFields(request, {
      firstName: body.firstName ?? customer.firstName,
      lastName: body.lastName ?? customer.lastName,
      phone: body.phone ?? customer.phone,
      mail: body.mail ?? customer.mail,
    })
    if (fields instanceof Response) return fields
    if (mailTaken(factoryId, fields.mail, id)) {
      return apiError(request, 409, `Customer with mail "${fields.mail}" already exists`)
    }
    // La identidad compuesta (factoryId, id) no cambia nunca.
    Object.assign(customer, fields)
    return HttpResponse.json(customer)
  }),

  // Factories (FabricaCliente) --------------------------------------------
  // Paginado y con los mismos filtros que el backend.
  http.get('/api/factories', ({ request }) => {
    const url = new URL(request.url)
    const pageParams = readPageParams(url)
    if (!pageParams) return apiError(request, 400, PAGE_LIMIT_ERROR)
    const categoryId = url.searchParams.get('categoryId')
    const nameContains = normalizeText(url.searchParams.get('nameContains')?.trim() ?? '')
    const activeParam = url.searchParams.get('active')

    let result = customersDb.factories
    if (categoryId) result = result.filter((f) => f.categoryId === categoryId)
    if (activeParam !== null) result = result.filter((f) => f.isActive === (activeParam === 'true'))
    if (nameContains) result = result.filter((f) => normalizeText(f.name).includes(nameContains))
    return HttpResponse.json(paginate(result, pageParams))
  }),

  http.get('/api/factories/:id', ({ request, params }) => {
    const id = String(params.id)
    const factory = findFactory(id)
    if (!factory) return factoryNotFound(request, id)
    return HttpResponse.json(factory)
  }),

  http.post('/api/factories', async ({ request }) => {
    const body = (await request.json()) as FactoryInput
    const name = body.name?.trim() ?? ''
    if (!name) return invalid(request, 'name', 'Factory name cannot be empty')
    // El backend valida el CUIT con las mismas reglas que shared/lib/cuit.
    const cuit = cuitDigits(body.cuit ?? '')
    if (cuitError(cuit)) return invalid(request, 'cuit', 'CUIT check digit is invalid')

    const badCategory = categoryProblem(request, body.categoryId)
    if (badCategory) return badCategory
    if (cuitTaken(cuit)) return apiError(request, 409, `Factory with cuit "${cuit}" already exists`)
    if (nameTaken(name)) return apiError(request, 409, `Factory with name "${name}" already exists`)

    const created: Factory = {
      id: nextFactoryId(),
      name,
      cuit,
      address: body.address?.trim() ?? '',
      payMethod: body.payMethod?.trim() ?? '',
      categoryId: String(body.categoryId),
      isActive: true,
    }
    customersDb.factories.push(created)
    return HttpResponse.json(created, { status: 201 })
  }),

  // Va antes del PATCH genérico ":id", como los de encargados.
  http.patch('/api/factories/:id/deactivate', ({ request, params }) => {
    const id = String(params.id)
    const factory = findFactory(id)
    if (!factory) return factoryNotFound(request, id)
    if (!factory.isActive) return apiError(request, 409, `Factory with ID ${id} is already inactive`)
    if (customersDb.customers.some((c) => c.factoryId === id && c.isActive)) {
      return apiError(request, 409, `Factory with ID ${id} has active customers and cannot be deactivated`)
    }
    factory.isActive = false
    return new HttpResponse(null, { status: 204 })
  }),

  http.patch('/api/factories/:id', async ({ request, params }) => {
    const id = String(params.id)
    // El CUIT no se modifica: el DTO no lo declara y el whitelist lo descarta.
    const { cuit: _ignored, ...body } = (await request.json()) as Partial<FactoryInput>
    if (Object.values(body).every((value) => value === undefined)) {
      return apiError(request, 400, 'At least one field must be provided')
    }
    const factory = findFactory(id)
    if (!factory) return factoryNotFound(request, id)
    if (body.categoryId !== undefined) {
      const badCategory = categoryProblem(request, body.categoryId)
      if (badCategory) return badCategory
    }
    if (body.name !== undefined) {
      if (!body.name.trim()) return invalid(request, 'name', 'Factory name cannot be empty')
      if (nameTaken(body.name, id)) {
        return apiError(request, 409, `Factory with name "${body.name.trim()}" already exists`)
      }
    }
    Object.assign(factory, {
      ...(body.name !== undefined ? { name: body.name.trim() } : {}),
      ...(body.address !== undefined ? { address: body.address.trim() } : {}),
      ...(body.payMethod !== undefined ? { payMethod: body.payMethod.trim() } : {}),
      ...(body.categoryId !== undefined ? { categoryId: String(body.categoryId) } : {}),
    })
    return HttpResponse.json(factory)
  }),
]
