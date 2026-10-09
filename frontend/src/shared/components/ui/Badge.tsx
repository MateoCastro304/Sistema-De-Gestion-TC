import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { EntityIcon } from './EntityIcon'
import type { EntityIconName } from './EntityIcon'

/**
 * ============================================================
 * Badge — etiqueta de categoría
 * ============================================================
 *
 * QUÉ HACE
 * Envuelve un texto corto en un `<span class="badge badge--X">`. La
 * forma sale entera del CSS; el componente no pinta nada por su cuenta.
 *
 * TODAS SE VEN IGUAL
 * En el rediseño la etiqueta es siempre el mismo relleno suave: el tipo
 * se distingue por su ícono, no por un color. La variante viaja igual
 * como clase (`.badge--ambar`) para que el día que una necesite color
 * propio alcance con escribir esa regla en styles.css.
 *
 * CÓMO SE USA
 *   <Badge variant="ambar" icon="material">Material</Badge>
 *   <Badge variant="neutral">Inactivo</Badge>
 *   <Badge>Sin categoría</Badge>
 */
export type BadgeVariant =
  | 'azul'
  | 'ambar'
  | 'verde'
  | 'neutral'
  /**
   * Para un dato que es una categoría pero no entra en una lista cerrada:
   * el rubro de una fábrica, que es texto libre creado por el usuario.
   * `neutral`, en cambio, significa algo: registro dado de baja.
   */
  | 'suave'

interface BadgeProps {
  children: ReactNode
  /** Sin variante queda la pastilla base, sin color. */
  variant?: BadgeVariant
  /** Ícono a la izquierda del texto (tipo de proveedor, rubro). */
  icon?: EntityIconName
}

export function Badge({ children, variant, icon }: BadgeProps) {
  return (
    <span className={cn('badge', variant && `badge--${variant}`)}>
      {icon && <EntityIcon name={icon} />}
      {children}
    </span>
  )
}
