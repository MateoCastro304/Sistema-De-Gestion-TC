import { http } from '@/shared/api/http'
import type { Supplier, SupplierCreate, SupplierUpdate } from '../types/supplier'

/**
 * Una función por endpoint del contrato. Devuelven el dato pelado: ni los
 * hooks ni los componentes tienen que saber que abajo hay axios.
 */

/**
 * El backend pagina de a 20 y devuelve la lista sin el total, así que no hay
 * forma de saber si quedaron proveedores afuera ni de armar un paginado. Hasta
 * que responda `{ items, total, page, limit }` (como fábricas y encargados),
 * se pide una página grande y el listado busca y filtra en el navegador.
 */
const WHOLE_CATALOG = 1000

export async function listSuppliers(): Promise<Supplier[]> {
  const { data } = await http.get<Supplier[]>('/suppliers', {
    params: { page: 1, limit: WHOLE_CATALOG },
  })
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