import { http } from '@/shared/api/http'
import type { Supplier, SupplierCreate, SupplierUpdate } from '../types/supplier'

/**
 * Una función por endpoint del contrato. Devuelven el dato pelado: ni los
 * hooks ni los componentes tienen que saber que abajo hay axios.
 */

export async function listSuppliers(): Promise<Supplier[]> {
  const { data } = await http.get<Supplier[]>('/suppliers')
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
 * deja de existir. Devuelve void (204 sin cuerpo); da 409 si esta en uso.
 */
export async function deleteSupplier(id: number): Promise<void> {
    await http.delete(`/suppliers/${id}`)
}