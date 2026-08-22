import { http } from '@/shared/api/http'
import type { Customer, CustomerInput, Industry } from '../types/customer'

/**
 * HTTP calls for the Customer catalog. Paths are relative to the axios
 * `baseURL` (`/api`), so `/customers` hits `/api/customers`. The contract these
 * follow is proposed in `docs/openapi/customers.yaml` (pending DTC-54).
 */

const BASE = '/customers'

export async function listCustomers(): Promise<Customer[]> {
  const { data } = await http.get<Customer[]>(BASE)
  return data
}

export async function getCustomer(id: string): Promise<Customer> {
  const { data } = await http.get<Customer>(`${BASE}/${id}`)
  return data
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const { data } = await http.post<Customer>(BASE, input)
  return data
}

export async function updateCustomer(
  id: string,
  input: CustomerInput,
): Promise<Customer> {
  const { data } = await http.patch<Customer>(`${BASE}/${id}`, input)
  return data
}

/** Baja lógica (CU-04): does not delete, only flips `isActive`. */
export async function deactivateCustomer(id: string): Promise<Customer> {
  const { data } = await http.patch<Customer>(`${BASE}/${id}/deactivate`)
  return data
}

/**
 * Rubros catalog, needed to populate the customer form's selector. Temporary
 * home until the Rubros feature exists.
 */
export async function listIndustries(): Promise<Industry[]> {
  const { data } = await http.get<Industry[]>('/industries')
  return data
}
