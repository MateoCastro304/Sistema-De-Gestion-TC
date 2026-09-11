import type { AvatarTone } from '@/shared/components/ui'
import type { SupplierType } from '../types/supplier'

/**
 * Color por rubro. El mismo tono se usa en tres lugares: la franja
 * izquierda de la fila, el cuadrado de las iniciales (Avatar) y la
 * etiqueta (Badge). Con eso el rubro se reconoce sin leer.
 *
 * Es sólo presentación: nada de esto filtra, ordena ni valida. El dato
 * sigue siendo `supplierType` tal cual viene del backend.
 *
 * Vive acá y no adentro de una página porque lo usan el listado y el
 * detalle, y si se duplicara los dos colores se irían separando.
 *
 * Los nombres de los tonos son neutros a propósito (azul, ambar, …) y
 * no "material" o "pintura": así los otros catálogos reusan las mismas
 * clases CSS con su propio criterio.
 */
/*
  Los tres primeros salen tal cual del prototipo:
    Material -> azul, Pintura -> ámbar, Repuesto -> verde.
  Tercerizado no existía en la maqueta (allá había sólo tres rubros),
  así que es el único que se decidió acá, y va al tono neutro para no
  robarle el color a ninguno de los tres que sí estaban definidos.
*/
export const TYPE_TONES: Record<SupplierType, AvatarTone> = {
  Material: 'azul',
  Pintura: 'ambar',
  Repuesto: 'verde',
  Tercerizado: 'neutral',
}
