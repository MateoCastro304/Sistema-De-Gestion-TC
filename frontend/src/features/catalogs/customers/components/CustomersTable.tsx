import { Link } from 'react-router'
import { Table } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import type { Customer } from '../types/customer'
import type { Factory } from '../types/factory'
import type { Industry } from '../types/industry'

interface CustomersTableProps {
  customers: Customer[]
  factories: Factory[]
  industries: Industry[]
  /** Called when the user confirms the baja lógica of a customer. */
  onDeactivate: (customer: Customer) => void
}

/** Read-only listing of customers/contacts (CU-03), with links to detail and baja. */
export function CustomersTable({
  customers,
  factories,
  industries,
  onDeactivate,
}: CustomersTableProps) {
  const factoryById = (id: string) => factories.find((f) => f.id === id)
  const industryName = (id: string) =>
    industries.find((i) => i.id === id)?.name ?? '—'

  const columns: Column<Customer>[] = [
    {
      header: 'Nombre',
      render: (c) => (
        <Link className="table__action" to={`/catalogs/customers/${c.id}`}>
          {c.firstName} {c.lastName}
        </Link>
      ),
    },
    { header: 'Teléfono', render: (c) => c.phone },
    { header: 'Email', render: (c) => c.email },
    {
      header: 'Fábrica',
      render: (c) => factoryById(c.factoryId)?.name ?? '—',
    },
    {
      header: 'Rubro',
      render: (c) => {
        const factory = factoryById(c.factoryId)
        return factory ? industryName(factory.industryId) : '—'
      },
    },
    {
      header: 'Acciones',
      align: 'center',
      render: (c) => (
        <>
          <Link className="table__action" to={`/catalogs/customers/${c.id}`}>
            Ver
          </Link>
          <span className="table__action-sep">·</span>
          <button
            type="button"
            className="table__action table__td--danger"
            onClick={() => onDeactivate(c)}
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
      data={customers}
      rowKey={(c) => c.id}
      emptyMessage="No hay encargados registrados."
    />
  )
}
