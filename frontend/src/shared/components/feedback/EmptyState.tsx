import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/**
 * Por qué no hay nada para mostrar:
 * - `empty`: todavía no se cargó ningún registro.
 * - `no-results`: hay registros, pero la búsqueda no encontró ninguno.
 * - `error`: no se pudieron traer.
 */
type EmptyStateKind = 'empty' | 'no-results' | 'error'

interface EmptyStateProps {
  kind?: EmptyStateKind
  title: string
  /** Línea de ayuda debajo del título. */
  children?: ReactNode
  /** Botón o enlace para salir del estado: dar de alta, limpiar, reintentar. */
  action?: ReactNode
  /**
   * Con fondo de tarjeta propio. Dentro de `<Table emptyState={…} />` no
   * hace falta (la tarjeta es la del listado); sí cuando va suelto, como
   * el "no encontrado" de una pantalla de detalle.
   */
  card?: boolean
}

// Los trazos son los del prototipo: caja, lupa tachada y triángulo.
const ICON_PATHS: Record<EmptyStateKind, string> = {
  empty: 'M10 2.6 17 6v8l-7 3.4L3 14V6zM3 6l7 3.4L17 6M10 9.4v8',
  'no-results': 'M14.5 9a5.5 5.5 0 1 1-11 0a5.5 5.5 0 1 1 11 0M13 13l4.5 4.5M6.5 9h5',
  error: 'M10 3 18 17H2zM10 8.5v3.5M10 14.6v.01',
}

/**
 * Lo que se ve en lugar de las filas cuando un listado no tiene nada que
 * mostrar: ícono, título, una línea de ayuda y la acción para salir.
 */
export function EmptyState({ kind = 'empty', title, children, action, card = false }: EmptyStateProps) {
  return (
    <div
      className={cn('state', kind === 'error' && 'state--error', card && 'state--card')}
      // Un error de carga aparece solo, sin que el usuario haga nada: se
      // anuncia. Los otros dos son respuesta a algo que acaba de hacer.
      role={kind === 'error' ? 'alert' : undefined}
    >
      <span className="state__icon" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d={ICON_PATHS[kind]} />
        </svg>
      </span>
      <p className="state__title">{title}</p>
      {children && <p className="state__text">{children}</p>}
      {action}
    </div>
  )
}
