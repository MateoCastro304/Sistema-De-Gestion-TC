import { Avatar, Table, TrashButton } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import type { Category } from '../types/category'

interface CategoriesTableProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDeactivate: (category: Category) => void
  emptyMessage?: string
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
  onDeactivate,
  emptyMessage = 'No hay rubros registrados.',
}: CategoriesTableProps) {
  const columns: Column<Category>[] = [
    {
      header: 'Nombre',
      render: (c) => (
        <span className="table__cell--nombre">
          <Avatar name={c.name} />
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
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M13.5 3.5 16.5 6.5 7 16H4v-3z" strokeLinejoin="round" />
            </svg>
          </button>
          <TrashButton label={`Dar de baja ${c.name}`} onClick={() => onDeactivate(c)} />
        </>
      ),
    },
  ]

  return (
    <Table
      /* Filas-tarjeta, como el resto de los catálogos. */
      variant="cards"
      gridTemplate="minmax(0,2fr) 180px 112px"
      columns={columns}
      data={categories}
      rowKey={(c) => c.id}
      emptyMessage={emptyMessage}
    />
  )
}
