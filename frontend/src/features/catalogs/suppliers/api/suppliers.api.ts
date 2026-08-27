import { http } from '@/shared/api/http'
import type { Supplier, SupplierCreate, SupplierUpdate } from '../types/supplier.ts';

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
 * Baja lógica. El backend pone active=false; el registro nunca se borra.
 * Responde 204 sin cuerpo, por eso no hay nada que devolver.
 */
export async function deactivateSupplier(id: number): Promise<void> {
    await http.delete(`/suppliers/${id}`)
}

/** Reactiva un proveedor dado de baja. */
export async function activateSupplier(id: number): Promise<Supplier> {
    const { data } = await http.patch<Supplier>(`/suppliers/${id}`, { active: true })
    return data
}