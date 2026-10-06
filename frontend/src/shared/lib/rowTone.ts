import type { AvatarTone } from '@/shared/components/ui'

/**
 * Tono de una fila según si el registro está activo o dado de baja.
 *
 * Es el criterio que usan Encargados y Fábricas para la franja de color,
 * el cuadrado de iniciales y la etiqueta. Proveedores usa otro (el rubro,
 * ver `features/catalogs/suppliers/utils/supplierTone.ts`), porque ahí los
 * rubros son una lista cerrada de cuatro valores; acá los rubros se crean
 * a mano desde el formulario, así que no hay nada fijo a lo que mapear
 * colores.
 *
 * Vive en shared y no adentro de un catálogo porque no sabe nada del
 * negocio: recibe un booleano y devuelve un tono.
 */
export function toneByStatus(isActive: boolean): AvatarTone {
  return isActive ? 'azul' : 'neutral'
}
