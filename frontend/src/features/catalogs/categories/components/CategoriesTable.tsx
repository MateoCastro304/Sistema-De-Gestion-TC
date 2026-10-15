import type { ReactNode } from 'react'
import { Avatar, Table, TrashButton } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import type { Category } from '../types/category'

interface CategoriesTableProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  /** Qué mostrar si no hay filas: sin registros, sin resultados o error. */
  emptyState?: ReactNode
  /** Pie del listado (la paginación). */
  footer?: ReactNode
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/**
 * Listing of rubros (CU-43), with edit (CU-42) and baja (CU-44) actions. Sólo
 * llegan rubros activos: los dados de baja no se muestran.
 */
export function CategoriesTable({
  categories,
  onEdit,
  onDelete,
  emptyState,
  footer,
}: CategoriesTableProps) {
  const columns: Column<Category>[] = [
    {
      header: 'Nombre',
      render: (c) => (
        <span className="table__cell--nombre">
          <Avatar name={c.name} icon="rubro" tone="suave" />
          <b>{c.name}</b>
        </span>
      ),
    },
    {
      header: 'Última modificación',
      render: (c) => (
        <span className="table__cell--mono">{dateFormatter.format(new Date(c.updatedAt))}</span>
      ),
    },
    {
      header: '',
      align: 'center',
      cellClassName: 'table__cell--acciones',
      // Editar y dar de baja como íconos, igual que los encargados dentro de
      // una fábrica: son dos acciones por fila.
      render: (c) => (
        <>
          <button
            type="button"
            className="row-action row-action--edit"
            onClick={() => onEdit(c)}
            aria-label={`Editar ${c.name}`}
            title="Editar"
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M13.5 3.5l3 3L7 16H4v-3zM11.5 5.5l3 3" />
            </svg>
          </button>
          <TrashButton label={`Dar de baja ${c.name}`} onClick={() => onDelete(c)} />
        </>
      ),
    },
  ]

  return (
    <Table
      /* Filas-tarjeta, como el resto de los catálogos. */
      variant="cards"
      gridTemplate="minmax(0,1fr) 220px 120px"
      columns={columns}
      data={categories}
      rowKey={(c) => c.id}
      emptyState={emptyState}
      footer={footer}
    />
  )
}
