import { Link } from 'react-router'
import { Badge, Table } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import type { Factory } from '../types/factory'
import type { Industry } from '../types/industry'
import { formatCuit } from '../schemas/factory.schema'

interface FactoriesTableProps {
  factories: Factory[]
  industries: Industry[]
  /** How many encargados each factory has, keyed by factory id. */
  contactsByFactory: Record<string, number>
}

/** Read-only listing of factories (CU-60), with a link to the detail. */
export function FactoriesTable({
  factories,
  industries,
  contactsByFactory,
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
    { header: 'CUIT', render: (f) => formatCuit(f.cuit) },
    { header: 'Rubro', render: (f) => industryName(f.industryId) },
    {
      header: 'Encargados',
      align: 'center',
      render: (f) => contactsByFactory[f.id] ?? 0,
    },
    {
      header: 'Estado',
      align: 'center',
      render: (f) =>
        f.isActive ? (
          <Badge variant="si">Activa</Badge>
        ) : (
          <Badge variant="pendiente">Inactiva</Badge>
        ),
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
      emptyMessage="No hay fábricas registradas."
    />
  )
}
