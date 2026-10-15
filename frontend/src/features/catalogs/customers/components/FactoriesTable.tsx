import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Avatar, Badge, Table } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import { toneByStatus } from '@/shared/lib/rowTone'
import { cn } from '@/shared/lib/cn'
import type { Factory } from '../types/factory'
import type { Category } from '../types/category'
import { formatCuit } from '../schemas/factory.schema'

interface FactoriesTableProps {
  factories: Factory[]
  categories: Category[]
  /** How many encargados each factory has, keyed by factory id. */
  contactsByFactory: Record<string, number>
  /** Qué mostrar si no hay filas: sin registros, sin resultados o error. */
  emptyState?: ReactNode
  /** Pie del listado (la paginación). */
  footer?: ReactNode
}

/** Read-only listing of factories (CU-60), with a link to the detail. */
export function FactoriesTable({
  factories,
  categories,
  contactsByFactory,
  emptyState,
  footer,
}: FactoriesTableProps) {
  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? '—'

  const columns: Column<Factory>[] = [
    {
      header: 'Nombre',
      render: (f) => (
        <span className="table__cell--nombre">
          <Avatar name={f.name} icon="fabrica" tone={toneByStatus(f.isActive)} />
          <b>{f.name}</b>
        </span>
      ),
    },
    // El CUIT va en monoespaciada: es un identificador, y así queda alineado
    // de una fila a la otra.
    {
      header: 'CUIT',
      render: (f) => <span className="table__cell--mono">{formatCuit(f.cuit)}</span>,
    },
    // El rubro va como etiqueta pero sin tono de color: los rubros se
    // crean a mano desde el formulario, así que no hay una lista cerrada
    // a la que asignarles colores. El color de la fila lo da el estado.
    {
      header: 'Rubro',
      render: (f) => <Badge variant="suave" icon="rubro">{categoryName(f.categoryId)}</Badge>,
    },
    {
      header: 'Encargados',
      align: 'center',
      render: (f) => {
        const count = contactsByFactory[f.id] ?? 0
        return <span className={cn('count-pill', count === 0 && 'count-pill--empty')}>{count}</span>
      },
    },
    {
      header: '',
      align: 'center',
      cellClassName: 'table__cell--fin',
      render: (f) => (
        <Link className="link-btn" to={`/catalogos/fabricas/${f.id}`}>
          Ver
        </Link>
      ),
    },
  ]

  return (
    <Table
      /* Rediseño: filas-tarjeta en vez de <table>. Los datos, el filtro y
         el rowKey son los mismos; lo nuevo son sólo props de presentación. */
      variant="cards"
      gridTemplate="minmax(0,2fr) 150px minmax(0,1fr) 120px 80px"
      rowClassName={(f) => cn(`table__row--${toneByStatus(f.isActive)}`)}
      columns={columns}
      data={factories}
      rowKey={(f) => f.id}
      emptyState={emptyState}
      footer={footer}
    />
  )
}
