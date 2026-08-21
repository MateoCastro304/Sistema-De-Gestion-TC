import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

/** Describes one column: its header and how to render each row's cell. */
export interface Column<T> {
  header: ReactNode
  render: (row: T) => ReactNode
  /** Horizontal alignment of the column; defaults to `left`. */
  align?: 'left' | 'center'
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  /** Stable unique key for each row (required by React lists). */
  rowKey: (row: T) => string | number
  /** Text shown when `data` is empty. */
  emptyMessage?: string
}

/**
 * Generic data table. The `<T>` type parameter lets the same component list
 * customers, materials, suppliers, ... without being rewritten per entity.
 */
export function Table<T>({
  columns,
  data,
  rowKey,
  emptyMessage = 'No records',
}: TableProps<T>) {
  return (
    <div className="table-card">
      <div className="table-card__scroll">
        <table className="table">
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'table__th',
                    col.align === 'center' && 'table__th--center',
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr className="table__row">
                <td
                  className="table__td table__td--muted table__td--center"
                  colSpan={columns.length}
                >
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
