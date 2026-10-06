import { http } from '@/shared/api/http'
import type { Page } from '@/shared/api/pagination'
import type {
  Customer,
  CustomerInput,
  CustomerListParams,
} from '../types/customer'
import type { Factory, FactoryInput } from '../types/factory'
import type { Industry } from '../types/industry'

/**
 * HTTP calls for the Customer catalog and its related Factory and Industry
 * catalogs. Paths are relative to the axios `baseURL` (`/api`). The contract is
 * proposed in `docs/openapi/customers.yaml` (pending DTC-54).
 */

const CUSTOMERS = '/customers'
const FACTORIES = '/factories'
const INDUSTRIES = '/industries'

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
    input,
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
    input,
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

/**
 * Reactivación (CU-04 inverso): vuelve a poner `isActive` en true. Como la
 * baja, responde `204 No Content` (sin cuerpo).
 */
export async function activateCustomer(
  factoryId: string,
  id: string,
): Promise<void> {
  await http.patch(`${customerPath(factoryId, id)}/activate`)
}

// Factories (FabricaCliente) ----------------------------------------------

export async function listFactories(): Promise<Factory[]> {
  const { data } = await http.get<Factory[]>(FACTORIES)
  return data
}

export async function createFactory(input: FactoryInput): Promise<Factory> {
  const { data } = await http.post<Factory>(FACTORIES, input)
  return data
}

export async function updateFactory(
  id: string,
  input: FactoryInput,
): Promise<Factory> {
  const { data } = await http.patch<Factory>(`${FACTORIES}/${id}`, input)
  return data
}

// Industries (Rubro) -------------------------------------------------------
//
// Solo lectura: el rubro es un catálogo de otra persona (su propio ABMC). Acá
// únicamente se consume la lista para el selector de la fábrica. El alta/edición
// de rubros no vive en este feature.

export async function listIndustries(): Promise<Industry[]> {
  const { data } = await http.get<Industry[]>(INDUSTRIES)
  return data
}
