import { Table } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import type { Category } from '../types/category'

interface CategoriesTableProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  emptyMessage?: string
}

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** Listing of rubros (CU-43), with edit (CU-42) and delete (CU-44) actions. */
export function CategoriesTable({
  categories,
  onEdit,
  onDelete,
  emptyMessage = 'No hay rubros registrados.',
}: CategoriesTableProps) {
  const columns: Column<Category>[] = [
    { header: 'Nombre', render: (c) => c.name },
    {
      header: 'Última modificación',
      align: 'center',
      render: (c) => dateFormatter.format(new Date(c.updatedAt)),
    },
    {
      header: 'Acciones',
      align: 'center',
      render: (c) => (
        <>
          <button
            type="button"
            className="table__action"
            onClick={() => onEdit(c)}
          >
            Editar
          </button>
          <span className="table__action-sep">·</span>
          <button
            type="button"
            className="table__action table__td--danger"
            onClick={() => onDelete(c)}
          >
            Eliminar
          </button>
        </>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={categories}
      rowKey={(c) => c.id}
      emptyMessage={emptyMessage}
    />
  )
}
