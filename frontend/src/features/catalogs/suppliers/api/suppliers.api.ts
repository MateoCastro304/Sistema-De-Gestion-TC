import { http } from '@/shared/api/http'
import type { Page } from '@/shared/api/pagination'
import type {
  Supplier,
  SupplierCreate,
  SupplierListParams,
  SupplierUpdate,
} from '../types/supplier'

/**
 * Una función por endpoint del contrato. Devuelven el dato pelado: ni los
 * hooks ni los componentes tienen que saber que abajo hay axios.
 */

/**
 * El backend busca y pagina, y responde `{ items, total, page, limit }`
 * igual que fábricas y encargados. Todos los params son opcionales; axios
 * saca de la query los que quedan en undefined.
 */
export async function listSuppliers(params?: SupplierListParams): Promise<Page<Supplier>> {
  const { data } = await http.get<Page<Supplier>>('/suppliers', { params })
  return data
}

export async function getSupplier(id: number): Promise<Supplier> {
  const { data } = await http.get<Supplier>(`/suppliers/${id}`)
  return data
}

export async function createSupplier(payload: SupplierCreate): Promise<Supplier> {
  const { data } = await http.post<Supplier>('/suppliers', payload)
  return data
}

export async function updateSupplier(id: number, payload: SupplierUpdate): Promise<Supplier> {
  const { data } = await http.patch<Supplier>(`/suppliers/${id}`, payload)
  return data
}

/**
 * Elimina un proveedor. Abajo el back hace baja logica, pero para el frontend
 * deja de existir. Devuelve void (204 sin cuerpo); da 404 si ya no existe.
 */
export async function deleteSupplier(id: number): Promise<void> {
    await http.delete(`/suppliers/${id}`)
}
