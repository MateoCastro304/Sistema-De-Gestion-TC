import type { CSSProperties, ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { cn } from '@/shared/lib/cn'

/**
 * ============================================================
 * Table — tabla genérica, ahora con dos formas de dibujarse
 * ============================================================
 *
 * QUÉ HACE
 * Recibe una lista de columnas y una lista de datos, y arma la tabla.
 * El `<T>` es lo que permite que la misma tabla liste Encargados,
 * Fábricas o Proveedores sin reescribirse: cada columna dice cómo
 * sacar su celda de una fila (`render`).
 *
 * QUÉ CAMBIÓ EN EL REDISEÑO (y por qué no rompe nada)
 * Se agregaron 4 props, TODAS opcionales, y `variant` arranca en
 * 'table'. Es decir: una llamada existente
 *     <Table columns={cols} data={rows} rowKey={r => r.id} />
 * cae en la rama de abajo, que es EXACTAMENTE el `<table>` de antes,
 * sin una línea cambiada. Los catálogos que todavía no migraron
 * siguen andando igual.
 *
 * LAS DOS VARIANTES
 * - `variant="table"` (default): `<table>` clásico con scroll
 *   horizontal. Es lo que hay hoy en el resto de la app.
 * - `variant="cards"`: no usa `<table>`; cada fila es un `<div>` en
 *   grid que se lee como una tarjeta y se levanta al pasar el mouse.
 *   Es la vista del rediseño. En celular el CSS le tira las columnas
 *   abajo y esconde el encabezado, así que cada fila queda como una
 *   ficha apilada.
 *
 * CÓMO SE DEFINEN LOS ANCHOS EN "cards"
 * No hay `<td>`, así que el ancho lo pone un grid. `gridTemplate`
 * viaja al CSS como la custom property `--rp-cols`, y una sola regla
 * en styles.css la aplica. Ventaja: cada catálogo define sus anchos
 * desde su propia página, sin agregar CSS.
 *   IMPORTANTE: las columnas flexibles van con minmax(0, Nfr). Con
 *   `1fr` a secas, el grid no puede achicarse por debajo del
 *   contenido y una razón social larga desborda la fila.
 *
 * CÓMO SE USA
 *   <Table
 *     variant="cards"
 *     gridTemplate="minmax(0,2.6fr) 112px 96px minmax(0,1fr) 136px 64px"
 *     columns={cols}
 *     data={rows}
 *     rowKey={(r) => r.id}
 *     rowClassName={(r) => `table__row--${r.tone}`}  // franja de color
 *     onRowClick={(r) => toggleSelected(r.id)}
 *   />
 *
 * SOBRE `onRowClick`
 * Si se pasa, la fila entera se vuelve clickeable. Cuando eso pasa el
 * componente le agrega `role="button"`, `tabIndex` y manejo de Enter
 * y Espacio: sin eso la selección sólo funcionaría con mouse y la
 * pantalla quedaría inaccesible por teclado. Es para tildar (modo
 * eliminación de Proveedores); el resaltado de ese modo
 * (`table__row--selectable`) lo agrega quien lo usa.
 *
 * SOBRE `rowHref`
 * Para abrir el detalle tocando la fila: `rowHref={(r) => \`/x/${r.id}\`}`.
 * La fila NO se vuelve botón (tiene un "Ver" y a veces un tacho adentro,
 * y un botón con botones adentro confunde al lector de pantalla); el
 * teclado sigue entrando por el "Ver".
 *
 * En los dos casos, los botones y enlaces de adentro de la fila ("Ver",
 * el tacho) hacen lo suyo y su click no dispara además el de la fila.
 *
 * SOBRE LA ANIMACIÓN DE ENTRADA
 * Cada fila entra con un retardo de 60ms escalonado, cortado a la
 * sexta fila. Si no se cortara, una lista de 50 registros tardaría
 * tres segundos en terminar de aparecer. Quien tenga activado
 * "reducir movimiento" en su sistema no ve nada de esto: el CSS lo
 * apaga con `prefers-reduced-motion`.
 */

/** Describe una columna: su encabezado y cómo se pinta cada celda. */
export interface Column<T> {
  header: ReactNode
  render: (row: T) => ReactNode
  /** Alineación horizontal; por defecto `left`. Vale para las dos variantes. */
  align?: 'left' | 'center'
  /**
   * Clase extra para la celda de esta columna, en las dos variantes.
   * Es opcional y sin ella no cambia nada, así que las páginas que no
   * la usan siguen igual.
   * En `cards` hace falta para cosas que dependen de ser hijo directo
   * del grid, como `table__cell--fin` (justify-self: end), que no se
   * puede lograr desde adentro del render.
   */
  cellClassName?: string
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  /** Clave única y estable por fila (la que pide React para listas). */
  rowKey: (row: T) => string | number
  /** Texto cuando `data` viene vacío. */
  emptyMessage?: string
  /**
   * Lo que se muestra en lugar de las filas cuando `data` viene vacío
   * (un `<EmptyState />`: sin registros, sin resultados o error de
   * carga). Si está, reemplaza a `emptyMessage`.
   */
  emptyState?: ReactNode
  /** Pie de la tarjeta, debajo de las filas (un `<Pagination />`). */
  footer?: ReactNode

  /* ---- Agregados por el rediseño. Todos opcionales: sin ellos el
     componente se comporta EXACTAMENTE como antes. ---- */

  /**
   * `table` (default) = la <table> de siempre.
   * `cards` = filas en grid, cada una una tarjeta que se levanta.
   */
  variant?: 'table' | 'cards'
  /**
   * Anchos de columna para `cards`, en sintaxis grid-template-columns.
   * Usar minmax(0,…) en las flexibles: si no, el grid se desborda en
   * vez de encogerse y los nombres largos se parten.
   * Ej: 'minmax(0,2.6fr) 112px 96px minmax(0,1fr) 136px 64px'
   */
  gridTemplate?: string
  /** Clase extra por fila: sirve para la franja de color por categoría. */
  rowClassName?: (row: T) => string | undefined
  /** Si está, toda la fila es clickeable (selección múltiple). */
  onRowClick?: (row: T) => void
  /**
   * Si está, tocar la fila abre esa URL (el detalle), igual que su
   * botón "Ver". Sólo mouse: el teclado y el lector de pantalla usan
   * el "Ver". Si también hay `onRowClick`, gana `onRowClick`.
   */
  rowHref?: (row: T) => string
}

/** Lo que tiene su propio click adentro de una fila. */
const INTERACTIVE = 'a, button, input, select, textarea, label, [role="combobox"]'

export function Table<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No hay registros',
  emptyState,
  footer,
  variant = 'table',
  gridTemplate,
  rowClassName,
  onRowClick,
  rowHref,
}: TableProps<T>) {
  const navigate = useNavigate()
  /* ---------- Variante del rediseño: filas en grid ---------- */
  if (variant === 'cards') {
    // El ancho de columnas viaja como custom property, así una sola
    // regla CSS sirve para todos los catálogos.
    const style = gridTemplate ? ({ '--rp-cols': gridTemplate } as CSSProperties) : undefined

    return (
      <div className="table-card table-card--cards" style={style}>
        {/* Encabezado de columnas. En celular el CSS lo esconde,
            porque cada fila ya se lee como ficha. */}
        <div className="table__head">
          {columns.map((col, i) => (
            <span key={i} className={col.align === 'center' ? 'table__head--center' : undefined}>
              {col.header}
            </span>
          ))}
        </div>

        {data.length === 0 ? (
          (emptyState ?? <div className="table__empty">{emptyMessage}</div>)
        ) : (
          data.map((row, index) => {
            // A dónde lleva la fila, si es una fila de "abrir el detalle".
            const href = rowHref?.(row)
            const handleClick = onRowClick ? () => onRowClick(row) : href ? () => void navigate(href) : undefined
            return (
              <div
                key={rowKey(row)}
                className={cn('table__row', rowClassName?.(row), handleClick && 'table__row--clickable')}
                // Escalonado de la entrada: 60ms por fila. Se corta a
                // los 6 para que una lista larga no tarde en aparecer.
                style={{ animationDelay: `${Math.min(index, 6) * 0.06}s` }}
                // Un click en un botón o enlace de la fila ("Ver", el tacho)
                // hace lo suyo y no dispara además el de la fila.
                onClick={
                  handleClick
                    ? (e) => {
                        const control = (e.target as HTMLElement).closest(INTERACTIVE)
                        if (control && control !== e.currentTarget) return
                        handleClick()
                      }
                    : undefined
                }
                // Selección: la fila tiene que ser alcanzable por teclado.
                // Con `rowHref` no hace falta: el "Ver" de la fila ya es un
                // enlace, y la fila no se vuelve un botón con botones adentro.
                role={onRowClick ? 'button' : undefined}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={
                  onRowClick
                    ? (e) => {
                        // Enter sobre un botón de adentro es de ese botón, no de la fila.
                        if (e.target !== e.currentTarget) return
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          onRowClick(row)
                        }
                      }
                    : undefined
                }
              >
                {columns.map((col, i) => (
                  <div
                    key={i}
                    className={cn('table__cell', col.align === 'center' && 'table__cell--center', col.cellClassName)}
                  >
                    {col.render(row)}
                  </div>
                ))}
              </div>
            )
          })
        )}

        {footer}
      </div>
    )
  }

  /* ---------- Variante original: intacta ---------- */
  return (
    <div className="table-card">
      <div className="table-card__scroll">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} className={cn('table__th', col.align === 'center' && 'table__th--center')}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr className="table__row">
                <td className="table__td table__td--muted table__td--center" colSpan={columns.length}>
                  {emptyState ?? emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={rowKey(row)} className="table__row">
                  {columns.map((col, i) => (
                    <td
                      key={i}
                      className={cn(
                        'table__td',
                        col.align === 'center' && 'table__td--center',
                        col.cellClassName,
                      )}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {footer}
    </div>
  )
}
