import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/** Visual states available in the stylesheet (`.badge--*`). */
export type BadgeVariant =
  | 'cotizado'
  | 'adjudicado'
  | 'vencido'
  | 'pendiente'
  | 'compra-material'
  | 'demorado'
  | 'tercerizado'
  | 'si'
  | 'conjunto'
  | 'simple'

interface BadgeProps {
  variant: BadgeVariant
  children: ReactNode
}

/** Small pill that shows a status. Maps `variant` to a `.badge--*` class. */
export function Badge({ variant, children }: BadgeProps) {
  return <span className={cn('badge', `badge--${variant}`)}>{children}</span>
}
