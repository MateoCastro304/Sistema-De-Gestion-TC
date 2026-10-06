import { Link } from 'react-router'
import { Avatar, Badge, Table } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import { toneByStatus } from '@/shared/lib/rowTone'
import { cn } from '@/shared/lib/cn'
import type { Factory } from '../types/factory'
import type { Industry } from '../types/industry'
import { formatCuit } from '../schemas/factory.schema'

interface FactoriesTableProps {
  factories: Factory[]
  industries: Industry[]
  /** How many encargados each factory has, keyed by factory id. */
  contactsByFactory: Record<string, number>
  /** Message shown when there are no rows (e.g. no factories vs. no matches). */
  emptyMessage?: string
}

/** Read-only listing of factories (CU-60), with a link to the detail. */
export function FactoriesTable({
  factories,
  industries,
  contactsByFactory,
  emptyMessage = 'No hay fábricas registradas.',
}: FactoriesTableProps) {
  const industryName = (id: string) =>
    industries.find((i) => i.id === id)?.name ?? '—'

  const columns: Column<Factory>[] = [
    {
      header: 'Nombre',
      render: (f) => (
        <span className="table__cell--nombre">
          <Avatar name={f.name} tone={toneByStatus(f.isActive)} />
          <b>{f.name}</b>
        </span>
      ),
    },
    // Código y CUIT en monoespaciada: son identificadores, y así quedan
    // alineados de una fila a la otra.
    { header: 'Código', render: (f) => <span className="table__cell--mono">{f.code}</span> },
    {
      header: 'CUIT',
      render: (f) => <span className="table__cell--mono">{formatCuit(f.cuit)}</span>,
    },
    // El rubro va como etiqueta pero sin tono de color: los rubros se
    // crean a mano desde el formulario, así que no hay una lista cerrada
    // a la que asignarles colores. El color de la fila lo da el estado.
    {
      header: 'Rubro',
      render: (f) => <Badge variant="suave">{industryName(f.industryId)}</Badge>,
    },
    {
      header: 'Encargados',
      align: 'center',
      render: (f) => contactsByFactory[f.id] ?? 0,
    },
    {
      header: '',
      align: 'center',
      cellClassName: 'table__cell--fin',
      render: (f) => (
        <Link className="link-btn" to={`/catalogs/factories/${f.id}`}>
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
      gridTemplate="minmax(0,2.4fr) 96px 136px minmax(0,1fr) 110px 72px"
      rowClassName={(f) => cn(`table__row--${toneByStatus(f.isActive)}`)}
      columns={columns}
      data={factories}
      rowKey={(f) => f.id}
      emptyMessage={emptyMessage}
    />
  )
}
