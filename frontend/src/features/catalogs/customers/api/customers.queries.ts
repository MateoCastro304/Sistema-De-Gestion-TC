import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import type {
  Customer,
  CustomerInput,
  CustomerListParams,
} from '../types/customer'
import type { FactoryInput } from '../types/factory'
import { customerKeys, factoryKeys, categoryKeys } from './customers.keys'
import {
  activateCustomer,
  createCustomer,
  createFactory,
  deactivateCustomer,
  getCustomer,
  listCustomers,
  listFactories,
  listCategories,
  updateCustomer,
  updateFactory,
} from './customers.api'

// Customers (EncargadoCliente) --------------------------------------------

/**
 * List customers (CU-03 Consultar Cliente). El filtrado y la paginación los hace
 * el backend: se le pasan los `params` (nombre, activo/inactivo, fábrica, página)
 * y devuelve `{ items, total, page, limit }`. `keepPreviousData` mantiene la
 * página anterior visible mientras carga la siguiente, para que no parpadee al
 * paginar o al tipear en el buscador.
 */
export function useCustomers(params?: CustomerListParams) {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: () => listCustomers(params),
    placeholderData: keepPreviousData,
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

/** Reactivación de un encargado dado de baja (CU-04 inverso), por (factoryId, id). */
export function useActivateCustomer() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ factoryId, id }: CustomerRef) =>
      activateCustomer(factoryId, id),
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

// Categories (Rubro) -------------------------------------------------------
//
// Solo consumo: el ABMC de rubro es de otra persona. Acá únicamente se lee la
// lista para poblar el selector de la fábrica.

/** Rubros for the factory form's selector (read-only). */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.all,
    queryFn: listCategories,
  })
}
