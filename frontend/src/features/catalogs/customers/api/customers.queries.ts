import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CustomerInput } from '../types/customer'
import { customerKeys, industryKeys } from './customers.keys'
import {
  createCustomer,
  deactivateCustomer,
  getCustomer,
  listCustomers,
  listIndustries,
  updateCustomer,
} from './customers.api'

/** List all customers (CU-03 Consultar Cliente). */
export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.lists(),
    queryFn: listCustomers,
  })
}

/** Single customer by id, for the detail/edit screen. */
export function useCustomer(id: string) {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomer(id),
    enabled: Boolean(id),
  })
}

/** Rubros for the form selector. */
export function useIndustries() {
  return useQuery({
    queryKey: industryKeys.all,
    queryFn: listIndustries,
  })
}

/** Create a customer (CU-01 Registrar Cliente). */
export function useCreateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}

/** Update a customer (CU-02 Modificar Cliente). */
export function useUpdateCustomer(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomerInput) => updateCustomer(id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(customerKeys.detail(id), updated)
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

/** Baja lógica of a customer (CU-04). */
export function useDeactivateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deactivateCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all })
    },
  })
}
