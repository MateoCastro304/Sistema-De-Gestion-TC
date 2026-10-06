import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * ============================================================
 * Badge — pastilla de estado o categoría
 * ============================================================
 *
 * QUÉ HACE
 * Envuelve un texto corto en un `<span class="badge badge--X">`. El
 * color y la forma salen enteros del CSS; el componente no pinta nada
 * por su cuenta.
 *
 * QUÉ CAMBIÓ EN EL REDISEÑO (y por qué no rompe nada)
 * 1. `variant` pasó a ser OPCIONAL. Antes era obligatorio, así que
 *    todo el código existente lo sigue pasando y funciona igual; la
 *    diferencia es que ahora se puede usar `<Badge>texto</Badge>`
 *    para una pastilla neutra sin inventar una variante.
 *    Sin `variant` sólo se aplica la clase base `.badge`.
 * 2. Se agregaron 4 variantes nuevas (azul, ambar, verde, neutral).
 *    Ninguna vieja se sacó ni se renombró, así que las pantallas de
 *    Cotizaciones, Órdenes y el wizard quedan intactas.
 *
 * DOS FAMILIAS DE VARIANTES
 * - Las de ESTADO (cotizado, adjudicado, vencido, pendiente, ...) son
 *   pastel: fondo suave y texto oscuro. Ya existían.
 * - Las de CATEGORÍA (azul, ambar, verde, neutral) son de color pleno
 *   con texto blanco. Se agregaron para los catálogos, donde la
 *   etiqueta no dice "en qué estado está" sino "de qué tipo es".
 *
 * CÓMO SE USA
 *   <Badge variant="pendiente">Pendiente</Badge>   // estado
 *   <Badge variant="ambar">Insumos</Badge>         // categoría
 *   <Badge>Sin categoría</Badge>                   // neutra
 *
 * AGREGAR UNA VARIANTE NUEVA son dos pasos: sumar el nombre a
 * `BadgeVariant` acá y escribir `.badge--<nombre>` en styles.css.
 */
export type BadgeVariant =
  // --- de estado (ya existían) ---
  | 'cotizado'
  | 'adjudicado'
  | 'vencido'
  | 'pendiente'
  | 'compra-material'
  | 'demorado'
  | 'si'
  | 'conjunto'
  | 'simple'
  | 'tercerizado'
  // --- de categoría (agregadas por el rediseño) ---
  | 'azul'
  | 'ambar'
  | 'verde'
  | 'neutral'
  /**
   * Pastilla gris clara con texto oscuro, para un dato que es una
   * categoría pero no tiene color propio: el rubro de una fábrica, por
   * ejemplo, que es texto libre creado por el usuario y por lo tanto no
   * se puede mapear a una paleta fija. Se distingue de `neutral`, que es
   * gris pleno y sí significa algo (registro dado de baja).
   */
  | 'suave'

interface BadgeProps {
  children: ReactNode
  /** Sin variante queda la pastilla base, sin color. */
  variant?: BadgeVariant
}

export function Badge({ children, variant }: BadgeProps) {
  return <span className={cn('badge', variant && `badge--${variant}`)}>{children}</span>
}
