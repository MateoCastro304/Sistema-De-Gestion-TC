import { http } from '@/shared/api/http'
import { ApiError } from '@/shared/api/ApiError'
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

/** Resultado del alta: el rubro, y si se reactivó uno dado de baja. */
export interface CreateCategoryResult {
  category: Category
  reactivated: boolean
}

/** Cuerpo del 409 del alta. `categoryId` sólo viene si el nombre es de un rubro dado de baja. */
interface CreateConflictBody {
  message?: string
  categoryId?: number
}

/**
 * CU-41 Registrar Rubro. Si el nombre es de un rubro dado de baja, el backend
 * responde 409 con su `categoryId`: en ese caso se reactiva ese rubro en vez
 * de crear uno nuevo.
 *
 * El 409 se acepta como respuesta (`validateStatus`) para poder leer
 * `categoryId`: el interceptor de `http` lo convertiría en un ApiError, que
 * no conserva los campos extra del cuerpo.
 */
export async function createCategory(input: CategoryInput): Promise<CreateCategoryResult> {
  const response = await http.post<Category | CreateConflictBody>(CATEGORIES, input, {
    validateStatus: (status) => (status >= 200 && status < 300) || status === 409,
  })

  if (response.status !== 409) {
    return { category: response.data as Category, reactivated: false }
  }

  const body = response.data as CreateConflictBody
  if (typeof body.categoryId === 'number') {
    return { category: await restoreCategory(body.categoryId), reactivated: true }
  }
  // Nombre de un rubro activo: el mismo error que hubiera dado el interceptor.
  throw new ApiError(409, body.message ?? 'Ya existe un rubro con ese nombre.')
}

/**
 * Reactiva un rubro dado de baja (`PATCH /categories/{id}/restore`). El
 * endpoint existe en el backend pero no en el contrato: ver
 * `docs/rubros-desvios-contrato.md`.
 */
export async function restoreCategory(id: number): Promise<Category> {
  const { data } = await http.patch<Category>(`${CATEGORIES}/${id}/restore`)
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
