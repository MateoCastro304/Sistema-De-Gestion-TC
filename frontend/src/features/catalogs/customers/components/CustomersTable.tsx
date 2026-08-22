import { Link } from 'react-router'
import { Badge, Table } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import { PERSON_TYPE_LABEL } from '../types/customer'
import type { Customer, Industry } from '../types/customer'

interface CustomersTableProps {
  customers: Customer[]
  industries: Industry[]
  /** Called when the user confirms the baja lógica of a customer. */
  onDeactivate: (customer: Customer) => void
}

/** Read-only listing of customers (CU-03), with links to detail and baja. */
export function CustomersTable({
  customers,
  industries,
  onDeactivate,
}: CustomersTableProps) {
  const industryName = (id: string) =>
    industries.find((i) => i.id === id)?.name ?? '—'

  const columns: Column<Customer>[] = [
    {
      header: 'Nombre',
      render: (c) => (
        <Link className="table__action" to={`/catalogs/customers/${c.id}`}>
          {c.name}
        </Link>
      ),
    },
    { header: 'Tipo', render: (c) => PERSON_TYPE_LABEL[c.personType] },
    { header: 'Rubro', render: (c) => industryName(c.industryId) },
    { header: 'Emails', render: (c) => c.emails.join(', ') },
    {
      header: 'Descripción de pago',
      render: (c) => (
        <span className="cell-truncate" title={c.paymentDescription}>
          {c.paymentDescription}
        </span>
      ),
    },
    {
      header: 'Estado',
      align: 'center',
      render: (c) =>
        c.isActive ? (
          <Badge variant="si">Activo</Badge>
        ) : (
          <Badge variant="pendiente">Inactivo</Badge>
        ),
    },
    {
      header: 'Acciones',
      align: 'center',
      render: (c) => (
        <>
          <Link className="table__action" to={`/catalogs/customers/${c.id}`}>
            Ver
          </Link>
          {c.isActive && (
            <>
              <span className="table__action-sep">·</span>
              <button
                type="button"
                className="table__action table__td--danger"
                onClick={() => onDeactivate(c)}
              >
                Desactivar
              </button>
            </>
          )}
        </>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={customers}
      rowKey={(c) => c.id}
      emptyMessage="No hay clientes registrados."
    />
  )
}
