import { Link } from 'react-router'
import { Table } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
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
        <Link className="table__action" to={`/catalogs/factories/${f.id}`}>
          {f.name}
        </Link>
      ),
    },
    { header: 'Código', render: (f) => f.code },
    { header: 'CUIT', render: (f) => formatCuit(f.cuit) },
    { header: 'Rubro', render: (f) => industryName(f.industryId) },
    {
      header: 'Encargados',
      align: 'center',
      render: (f) => contactsByFactory[f.id] ?? 0,
    },
    {
      header: 'Acciones',
      align: 'center',
      render: (f) => (
        <Link className="table__action" to={`/catalogs/factories/${f.id}`}>
          Ver
        </Link>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={factories}
      rowKey={(f) => f.id}
      emptyMessage={emptyMessage}
    />
  )
}
