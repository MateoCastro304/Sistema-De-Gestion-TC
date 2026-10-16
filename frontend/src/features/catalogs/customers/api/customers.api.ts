import { http } from '@/shared/api/http'
import { fetchAllPages, type Page } from '@/shared/api/pagination'
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

// La ruta es /managers (el backend llama "Manager" al encargado, para no
// repetir "customers" como nombre del subsystem y de la entidad a la vez).
const CUSTOMERS = '/managers'
const FACTORIES = '/factories'

/**
 * Tamaño de página al paginar un catálogo chico hasta traerlo completo.
 * Coincide con el cap del backend (`MAX_PAGE_LIMIT`): pedir más no sirve, el
 * backend lo rechaza con 400.
 */
const CATALOG_PAGE_SIZE = 100

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

/**
 * Todos los customers que matchean el filtro, paginando con
 * `CATALOG_PAGE_SIZE` hasta agotar `total`. Para pantallas que necesitan la
 * lista completa (ej. contar encargados activos por fábrica) hasta que el
 * backend ofrezca un conteo dedicado (DTC-54).
 */
export async function listAllCustomers(
  params?: Omit<CustomerListParams, 'page' | 'limit'>,
): Promise<Customer[]> {
  return fetchAllPages(
    (page, limit) => listCustomers({ ...params, page, limit }),
    CATALOG_PAGE_SIZE,
  )
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
//
// El backend llama `legalName` a la razón social (misma convención que
// Supplier); acá adentro se sigue usando `name` para no tocar los
// formularios y tablas que ya lo consumen así.

type FactoryWire = Omit<Factory, 'name'> & { legalName: string }

function toFactory({ legalName, ...rest }: FactoryWire): Factory {
  return { ...rest, name: legalName }
}

/** Catálogo chico: se pagina con CATALOG_PAGE_SIZE hasta traerlo completo. */
export async function listFactories(): Promise<Factory[]> {
  const items = await fetchAllPages(
    (page, limit) =>
      http
        .get<Page<FactoryWire>>(FACTORIES, { params: { page, limit } })
        .then((res) => res.data),
    CATALOG_PAGE_SIZE,
  )
  return items.map(toFactory)
}

export async function createFactory(input: FactoryInput): Promise<Factory> {
  const body = {
    legalName: input.name,
    cuit: input.cuit,
    address: input.address,
    categoryId: input.categoryId,
    payMethod: input.payMethod,
  }
  const { data } = await http.post<FactoryWire>(FACTORIES, body)
  return toFactory(data)
}

export async function updateFactory(
  id: string,
  input: FactoryInput,
): Promise<Factory> {
  // El CUIT no se puede modificar: el backend lo ignora, así que ni se manda.
  const body = {
    legalName: input.name,
    address: input.address,
    categoryId: input.categoryId,
    payMethod: input.payMethod,
  }
  const { data } = await http.patch<FactoryWire>(`${FACTORIES}/${id}`, body)
  return toFactory(data)
}

/** Baja lógica de una fábrica. Responde 409 si tiene encargados activos. */
export async function deactivateFactory(id: string): Promise<void> {
  await http.patch(`${FACTORIES}/${id}/deactivate`)
}

// Los rubros no se piden desde acá: la lista la trae la feature de Rubros
// (`features/catalogs/categories`) y el selector de la fábrica la lee de su
// misma caché. Ver `useCategories` en customers.queries.ts.
