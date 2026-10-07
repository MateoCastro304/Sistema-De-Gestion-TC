import { isApiError } from '@/shared/api/ApiError'

/**
 * Mensaje para el usuario cuando falla una operación sobre un rubro.
 *
 * Los 409 del backend de rubros ya vienen en español y explican la causa
 * ("Ya existe un rubro con ese nombre", "existen fábricas activas
 * asociadas"), así que se muestran tal cual. Los 400 de validación vienen
 * en inglés ("name must be longer than..."): esos caen en `fallback`.
 */
export function categoryErrorMessage(error: unknown, fallback: string): string {
  if (!isApiError(error)) return fallback
  if (error.isNetworkError || error.isServer || error.isConflict) return error.message
  if (error.isNotFound) return 'El rubro ya no existe.'
  return fallback
}
