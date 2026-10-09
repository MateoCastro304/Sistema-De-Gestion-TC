import { isApiError } from '@/shared/api/ApiError'

/**
 * Mensajes para mostrarle al usuario cuando falla una operación.
 *
 * El backend manda varios mensajes en inglés y pensados para el
 * desarrollador ("Factory with cuit \"30712345671\" already exists"), así
 * que no se muestran tal cual: acá se traduce cada caso conocido por su
 * código HTTP. Lo que no se reconoce cae en `fallback`, que lo define cada
 * pantalla.
 */

/** Sin red, backend caído o error 500: http.ts ya arma ese mensaje en español. */
function transportMessage(error: unknown): string | null {
  if (!isApiError(error)) return null
  return error.isNetworkError || error.isServer ? error.message : null
}

export function factoryErrorMessage(error: unknown, fallback: string): string {
  const transport = transportMessage(error)
  if (transport) return transport
  if (isApiError(error)) {
    if (error.isConflict) {
      // 409 posibles: baja con encargados activos, ya dada de baja, nombre
      // repetido o CUIT repetido.
      if (error.message.includes('active customers')) {
        return 'No se puede eliminar: la fábrica tiene encargados activos. Eliminá primero a sus encargados.'
      }
      if (error.message.includes('already inactive')) return 'La fábrica ya estaba eliminada.'
      if (error.message.startsWith('Factory with name')) {
        return 'Ya existe una fábrica con ese nombre.'
      }
      return 'Ya existe una fábrica registrada con ese CUIT.'
    }
    if (error.isNotFound) return 'La fábrica ya no existe.'
  }
  return fallback
}

export function customerErrorMessage(error: unknown, fallback: string): string {
  const transport = transportMessage(error)
  if (transport) return transport
  if (isApiError(error)) {
    if (error.isConflict) {
      // Hay dos 409 posibles al guardar un encargado: la fábrica dada de
      // baja o el mail repetido dentro de la fábrica.
      return error.message.includes('inactive')
        ? 'La fábrica está dada de baja: no se le pueden agregar encargados.'
        : 'Ya existe un encargado con ese email en esta fábrica.'
    }
    if (error.isNotFound) return 'El encargado o su fábrica ya no existen.'
  }
  return fallback
}

/** Nombre y apellido juntos. El apellido es opcional: sin él no queda un espacio suelto. */
export function customerFullName(customer: { firstName: string; lastName: string }): string {
  return `${customer.firstName} ${customer.lastName}`.trim()
}
