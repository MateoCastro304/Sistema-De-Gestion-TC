import type { CSSProperties, ReactNode } from 'react'
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
 * pantalla quedaría inaccesible por teclado.
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
  /** Alineación horizontal; por defecto `left`. Sólo aplica a `variant="table"`. */
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
}

export function Table<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No hay registros',
  variant = 'table',
  gridTemplate,
  rowClassName,
  onRowClick,
}: TableProps<T>) {
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
            <span key={i}>{col.header}</span>
          ))}
        </div>

        {data.length === 0 ? (
          <div className="table__empty">{emptyMessage}</div>
        ) : (
          data.map((row, index) => (
            <div
              key={rowKey(row)}
              className={cn('table__row', rowClassName?.(row), onRowClick && 'table__row--selectable')}
              // Escalonado de la entrada: 60ms por fila. Se corta a
              // los 6 para que una lista larga no tarde en aparecer.
              style={{ animationDelay: `${Math.min(index, 6) * 0.06}s` }}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              // Si la fila es clickeable tiene que ser alcanzable por
              // teclado: sin esto la selección no es accesible.
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onKeyDown={
                onRowClick
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        onRowClick(row)
                      }
                    }
                  : undefined
              }
            >
              {columns.map((col, i) => (
                <div key={i} className={cn('table__cell', col.cellClassName)}>
                  {col.render(row)}
                </div>
              ))}
            </div>
          ))
        )}
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
                  {emptyMessage}
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
    </div>
  )
}
