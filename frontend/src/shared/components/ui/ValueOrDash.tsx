import { cn } from '@/shared/lib/cn'

interface ValueOrDashProps {
  /** El dato a mostrar. Vacío, sólo espacios, null o undefined cuentan como "sin dato". */
  value?: string | null
  /** Clase para el dato cuando existe (por ejemplo `table__cell--mono`). */
  className?: string
}

/**
 * Muestra un dato o, si falta, el guion gris de "sin dato".
 *
 * Existe para que el guion sea siempre el mismo. Antes cada tabla escribía
 * su propio '—' y salía distinto según la tipografía de la celda: más corto
 * dentro de una monoespaciada, más oscuro en texto común.
 *
 * El guion lleva `table__cell--vacio`, y eso además le sirve a la ficha de
 * celular: ahí las celdas sin dato se esconden por esa clase, porque sin
 * encabezado de columna un guion suelto no dice de qué es.
 *
 *   <ValueOrDash value={supplier.cuit} className="table__cell--mono" />
 */
export function ValueOrDash({ value, className }: ValueOrDashProps) {
  if (!value?.trim()) return <span className="table__cell--vacio">—</span>
  return <span className={cn(className)}>{value}</span>
}
