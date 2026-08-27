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

export async function listCustomers(): Promise<Customer[]> {
  const { data } = await http.get<Customer[]>(CUSTOMERS)
  return data
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await http.get<Customer>(`${CUSTOMERS}/${id}`)
  return data
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const { data } = await http.post<Customer>(CUSTOMERS, input)
  return data
}

export async function updateCustomer(
  id: string,
  input: CustomerInput,
): Promise<Customer> {
  const { data } = await http.patch<Customer>(`${CUSTOMERS}/${id}`, input)
  return data
}

/** Baja lógica (CU-04): does not delete, only flips `isActive`. */
export async function deactivateCustomer(id: string): Promise<Customer> {
  const { data } = await http.patch<Customer>(`${CUSTOMERS}/${id}/deactivate`)
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
