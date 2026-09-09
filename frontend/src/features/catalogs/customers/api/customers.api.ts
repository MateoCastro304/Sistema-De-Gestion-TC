import { http } from '@/shared/api/http'
import type { Customer, CustomerInput } from '../types/customer'
import type { Factory, FactoryInput } from '../types/factory'
import type { Industry, IndustryInput } from '../types/industry'

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

export async function listCustomers(): Promise<Customer[]> {
  const { data } = await http.get<Customer[]>(CUSTOMERS)
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

/** Baja lógica (CU-04): does not delete, only flips `isActive`. */
export async function deactivateCustomer(
  factoryId: string,
  id: string,
): Promise<Customer> {
  const { data } = await http.patch<Customer>(
    `${customerPath(factoryId, id)}/deactivate`,
  )
  return data
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

export async function listIndustries(): Promise<Industry[]> {
  const { data } = await http.get<Industry[]>(INDUSTRIES)
  return data
}

export async function createIndustry(input: IndustryInput): Promise<Industry> {
  const { data } = await http.post<Industry>(INDUSTRIES, input)
  return data
}
