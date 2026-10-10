import { http } from '@/shared/api/http'
import type { Category, CategoryInput } from '../types/category'

/**
 * HTTP calls for the Rubros (Categories) catalog. Paths are relative to the
 * axios `baseURL` (`/api`) and follow `docs/openapi/paths/categories*.yaml`.
 *
 * OJO: donde el contrato y el backend no coinciden (baja lógica, `active`,
 * mínimo de 3 caracteres, 409s), esto sigue al backend para que la pantalla
 * funcione. Ver `docs/rubros-desvios-contrato.md`.
 */

const CATEGORIES = '/categories'

/**
 * The contract paginates (`limit` defaults to 20, max 100). The rubro catalog
 * is small, so the screen asks for the largest page and filters client side.
 */
const LIST_LIMIT = 100

/** CU-43 Consultar Rubro. */
export async function listCategories(): Promise<Category[]> {
  const { data } = await http.get<Category[]>(CATEGORIES, {
    params: { page: 1, limit: LIST_LIMIT },
  })
  return data
}

export async function getCategory(id: number): Promise<Category> {
  const { data } = await http.get<Category>(`${CATEGORIES}/${id}`)
  return data
}

/** CU-41 Registrar Rubro. */
export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data } = await http.post<Category>(CATEGORIES, input)
  return data
}

/** CU-42 Modificar Rubro. */
export async function updateCategory(
  id: number,
  input: CategoryInput,
): Promise<Category> {
  const { data } = await http.patch<Category>(`${CATEGORIES}/${id}`, input)
  return data
}

/**
 * CU-44 Baja de Rubro. Baja lógica (204): el rubro queda en la base sólo como
 * registro y deja de listarse. El backend responde 409 si alguna fábrica
 * activa lo usa.
 */
export async function deleteCategory(id: number): Promise<void> {
  await http.delete(`${CATEGORIES}/${id}`)
}
