import { http } from '@/shared/api/http'
import type { Page } from '@/shared/api/pagination'
import type {
  Customer,
  CustomerInput,
  CustomerListParams,
} from '../types/customer'
import type { Factory, FactoryInput } from '../types/factory'

/**
 * HTTP calls for the Customer catalog and its related Factory catalog. Paths
 * are relative to the axios `baseURL` (`/api`) and follow the backend
 * controllers (`customers.controller.ts`, `factory.controller.ts`); the
 * decisions behind names and shapes are in
 * `docs/decisions/decisiones-clientes-fabricas.md`.
 */

const CUSTOMERS = '/customers'
const FACTORIES = '/factories'

/** Los catálogos chicos se piden en una sola página grande y se filtran acá. */
const CATALOG_LIMIT = 1000

// Customers (EncargadoCliente) --------------------------------------------
//
// A customer is identified by the composite key (factoryId, id), mirroring the
// DB primary key `manager_customer(factory_id, id)`. Item operations are nested
// under the owning factory: `/factories/{factoryId}/customers/{id}`. The flat
// `/customers` collection is kept only for the global list view.

function customerPath(factoryId: string, id: string): string {
  return `${FACTORIES}/${factoryId}${CUSTOMERS}/${id}`
}

/**
 * El factoryId viaja en la URL, no en el cuerpo: el backend rechaza las
 * propiedades que no declara.
 */
function toCustomerBody({ firstName, lastName, phone, mail }: CustomerInput) {
  return { firstName, lastName, phone, mail }
}

/**
 * Global customer list (CU-03). The backend filters and paginates server-side
 * and answers with a `{ items, total, page, limit }` envelope. All params are
 * optional and combinable; axios omits the `undefined` ones from the query
 * string. Passing `factoryId` scopes it to one factory's contacts.
 */
export async function listCustomers(
  params?: CustomerListParams,
): Promise<Page<Customer>> {
  const { data } = await http.get<Page<Customer>>(CUSTOMERS, { params })
  return data
}

export async function getCustomer(
  factoryId: string,
  id: string,
): Promise<Customer> {
  const { data } = await http.get<Customer>(customerPath(factoryId, id))
  return data
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const { data } = await http.post<Customer>(
    `${FACTORIES}/${input.factoryId}${CUSTOMERS}`,
    toCustomerBody(input),
  )
  return data
}

export async function updateCustomer(
  factoryId: string,
  id: string,
  input: CustomerInput,
): Promise<Customer> {
  const { data } = await http.patch<Customer>(
    customerPath(factoryId, id),
    toCustomerBody(input),
  )
  return data
}

/**
 * Baja lógica (CU-04): does not delete, only flips `isActive`. The backend
 * answers `204 No Content`, so there is no body to return.
 */
export async function deactivateCustomer(
  factoryId: string,
  id: string,
): Promise<void> {
  await http.patch(`${customerPath(factoryId, id)}/deactivate`)
}

// Factories (FabricaCliente) ----------------------------------------------

/** El backend pagina: se pide una página grande y se devuelven sus items. */
export async function listFactories(): Promise<Factory[]> {
  const { data } = await http.get<Page<Factory>>(FACTORIES, {
    params: { page: 1, limit: CATALOG_LIMIT },
  })
  return data.items
}

export async function createFactory(input: FactoryInput): Promise<Factory> {
  const { data } = await http.post<Factory>(FACTORIES, input)
  return data
}

export async function updateFactory(
  id: string,
  input: FactoryInput,
): Promise<Factory> {
  // El CUIT no se puede modificar: el backend lo ignora, así que ni se manda.
  const body = {
    name: input.name,
    address: input.address,
    categoryId: input.categoryId,
    payMethod: input.payMethod,
  }
  const { data } = await http.patch<Factory>(`${FACTORIES}/${id}`, body)
  return data
}

/** Baja lógica de una fábrica. Responde 409 si tiene encargados activos. */
export async function deactivateFactory(id: string): Promise<void> {
  await http.patch(`${FACTORIES}/${id}/deactivate`)
}

// Los rubros no se piden desde acá: la lista la trae la feature de Rubros
// (`features/catalogs/categories`) y el selector de la fábrica la lee de su
// misma caché. Ver `useCategories` en customers.queries.ts.
