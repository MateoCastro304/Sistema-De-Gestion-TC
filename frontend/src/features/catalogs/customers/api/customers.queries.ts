import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CustomerInput } from '../types/customer'
import type { FactoryInput } from '../types/factory'
import { customerKeys, factoryKeys, industryKeys } from './customers.keys'
import {
  createCustomer,
  createFactory,
  createIndustry,
  deactivateCustomer,
  getCustomer,
  listCustomers,
  listFactories,
  listIndustries,
  updateCustomer,
  updateFactory,
} from './customers.api'

// Customers (EncargadoCliente) --------------------------------------------

/**
 * List all customers (CU-03 Consultar Cliente). Los dados de baja lógica no se
 * muestran: se filtran por `isActive` para que no aparezcan en ninguna pantalla.
 */
export function useCustomers() {
  return useQuery({
    queryKey: customerKeys.lists(),
    queryFn: listCustomers,
    select: (data) => data.filter((c) => c.isActive),
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

// Factories (FabricaCliente) ----------------------------------------------

/**
 * Factories, used by the customer form's selector and the factory modal. Solo
 * activas: las dadas de baja no se muestran en listados ni selectores.
 */
export function useFactories() {
  return useQuery({
    queryKey: factoryKeys.lists(),
    queryFn: listFactories,
    select: (data) => data.filter((f) => f.isActive),
  })
}

/** Create a factory (CU-58) from the customer window. */
export function useCreateFactory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createFactory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factoryKeys.all })
    },
  })
}

/** Update a factory (CU-59) from the customer window. */
export function useUpdateFactory(id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: FactoryInput) => updateFactory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factoryKeys.all })
    },
  })
}

// Industries (Rubro) -------------------------------------------------------

/** Rubros for the factory form's selector. */
export function useIndustries() {
  return useQuery({
    queryKey: industryKeys.all,
    queryFn: listIndustries,
  })
}

/** Create a rubro (CU-41) inline from the factory form. */
export function useCreateIndustry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createIndustry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: industryKeys.all })
    },
  })
}
