import type { AvatarTone, EntityIconName } from '@/shared/components/ui'
import type { SupplierType } from '../types/supplier'

/**
 * Color por rubro. El mismo tono se usa en tres lugares: la franja
 * izquierda de la fila, el cuadrado de las iniciales (Avatar) y la
 * etiqueta (Badge). Con eso el rubro se reconoce sin leer.
 *
 * Es sólo presentación: nada de esto filtra, ordena ni valida. El dato
 * sigue siendo `supplierTypes` tal cual viene del backend.
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
  MATERIAL: 'azul',
  PAINT: 'ambar',
  REPLACEMENT: 'verde',
  PROCESS: 'neutral',
}

/**
 * Tono de la fila y del avatar. Un proveedor puede tener varios rubros
 * pero la franja es una sola: manda el primero de la lista. Las etiquetas
 * sí van una por rubro, cada una con su color.
 */
export function supplierTone(supplierTypes: SupplierType[]): AvatarTone {
  return TYPE_TONES[supplierTypes[0]] ?? 'neutral'
}

/** Ícono de cada tipo: es lo que distingue a un tipo de otro en pantalla. */
export const TYPE_ICONS: Record<SupplierType, EntityIconName> = {
  MATERIAL: 'material',
  PAINT: 'pintura',
  REPLACEMENT: 'repuesto',
  PROCESS: 'tercerizado',
}

/** Ícono del avatar: el del primer tipo del proveedor. */
export function supplierIcon(supplierTypes: SupplierType[]): EntityIconName {
  return TYPE_ICONS[supplierTypes[0]] ?? 'proveedor'
}
