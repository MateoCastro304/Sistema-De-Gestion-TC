import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Customer, CustomerInput } from '../types/customer'
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
 * List customers (CU-03 Consultar Cliente). Por defecto oculta los dados de baja
 * lógica (`isActive`), como en el resto del sistema. Con `includeInactive` se
 * devuelven también los inactivos, para las pantallas que ofrecen el filtro
 * "mostrar inactivos" (regla de negocio: los inactivos se ven solo bajo demanda).
 */
export function useCustomers(options?: { includeInactive?: boolean }) {
  const includeInactive = options?.includeInactive ?? false
  return useQuery({
    queryKey: customerKeys.lists(),
    queryFn: listCustomers,
    select: includeInactive
      ? undefined
      : (data) => data.filter((c) => c.isActive),
  })
}

/**
 * Single customer by its composite key (factoryId, id), for the detail/edit
 * screen. Both parts are required because `id` is only unique within a factory.
 */
export function useCustomer(factoryId: string, id: string) {
  return useQuery({
    queryKey: customerKeys.detail(factoryId, id),
    queryFn: () => getCustomer(factoryId, id),
    enabled: Boolean(factoryId) && Boolean(id),
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

/** Update a customer (CU-02 Modificar Cliente), addressed by (factoryId, id). */
export function useUpdateCustomer(factoryId: string, id: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CustomerInput) => updateCustomer(factoryId, id, input),
    onSuccess: (updated) => {
      queryClient.setQueryData(customerKeys.detail(factoryId, id), updated)
      queryClient.invalidateQueries({ queryKey: customerKeys.lists() })
    },
  })
}

/** Identity of a customer: its composite key (factoryId, id). */
type CustomerRef = Pick<Customer, 'factoryId' | 'id'>

/** Baja lógica of a customer (CU-04), addressed by (factoryId, id). */
export function useDeactivateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ factoryId, id }: CustomerRef) =>
      deactivateCustomer(factoryId, id),
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
