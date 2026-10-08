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
import type { Category } from '../types/category'
import {
  categoryKeys,
  listCategories,
} from '@/features/catalogs/categories'
import type { Category as BackendCategory } from '@/features/catalogs/categories'
import { customerKeys, factoryKeys } from './customers.keys'
import {
  createCustomer,
  createFactory,
  deactivateCustomer,
  deactivateFactory,
  getCustomer,
  listCustomers,
  listFactories,
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

/** Baja lógica de una fábrica. Falla con 409 si tiene encargados activos. */
export function useDeactivateFactory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deactivateFactory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: factoryKeys.all })
    },
  })
}

// Categories (Rubro) -------------------------------------------------------
//
// Solo consumo: el ABMC de rubro es de otra persona. Acá únicamente se lee la
// lista para poblar el selector de la fábrica.

/**
 * Adapta los rubros del backend a la forma que usa el formulario de fábrica:
 * id como texto (sale de un <Select>) e `isActive`. Está fuera del hook para
 * que su referencia no cambie: react-query sólo vuelve a correr `select`
 * cuando cambian los datos o la función.
 */
function toSelectorCategories(categories: BackendCategory[]): Category[] {
  return categories.map((category) => ({
    id: String(category.id),
    name: category.name,
    isActive: category.active ?? true,
  }))
}

/**
 * Rubros for the factory form's selector (read-only).
 *
 * Usa la MISMA clave y la misma función que la pantalla de Rubros, así las dos
 * comparten una sola caché: crear, renombrar o eliminar un rubro allá invalida
 * esta lista y el selector se entera al instante. Antes cada pantalla tenía su
 * copia y un rubro nuevo tardaba hasta un minuto en aparecer acá.
 */
export function useCategories() {
  return useQuery({
    queryKey: categoryKeys.lists(),
    queryFn: listCategories,
    select: toSelectorCategories,
  })
}
