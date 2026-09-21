import { Link } from 'react-router'
import { Badge, Table } from '@/shared/components/ui'
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
  /** Called to reactivar (CU-04 inverso) a customer dado de baja. */
  onActivate?: (customer: Customer) => void
  /** Message shown when there are no rows (e.g. no matches for the search). */
  emptyMessage?: string
}

/** Read-only listing of customers/contacts (CU-03), with links to detail and baja. */
export function CustomersTable({
  customers,
  factories,
  industries,
  onDeactivate,
  onActivate,
  emptyMessage = 'No hay encargados registrados.',
}: CustomersTableProps) {
  const factoryById = (id: string) => factories.find((f) => f.id === id)
  const industryName = (id: string) =>
    industries.find((i) => i.id === id)?.name ?? '—'

  const columns: Column<Customer>[] = [
    {
      header: 'Nombre',
      render: (c) => (
        <span className="table__name-cell">
          <Link className="table__action" to={`/catalogos/encargados/${c.factoryId}/${c.id}`}>
            {c.firstName} {c.lastName}
          </Link>
          {!c.isActive && <Badge variant="pendiente">Inactivo</Badge>}
        </span>
      ),
    },
    {
      header: 'Teléfono',
      render: (c) => (
        <span className="table__name-cell">
          {c.phone || '—'}
          {c.hasWhatsapp && <Badge variant="si">WhatsApp</Badge>}
        </span>
      ),
    },
    { header: 'Email', render: (c) => c.mail || '—' },
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
          <Link className="table__action" to={`/catalogos/encargados/${c.factoryId}/${c.id}`}>
            Ver
          </Link>
          {c.isActive ? (
            <>
              <span className="table__action-sep">·</span>
              <button
                type="button"
                className="table__action table__td--danger"
                onClick={() => onDeactivate(c)}
              >
                Eliminar
              </button>
            </>
          ) : (
            onActivate && (
              <>
                <span className="table__action-sep">·</span>
                <button
                  type="button"
                  className="table__action"
                  onClick={() => onActivate(c)}
                >
                  Reactivar
                </button>
              </>
            )
          )}
        </>
      ),
    },
  ]

  return (
    <Table
      columns={columns}
      data={customers}
      rowKey={(c) => `${c.factoryId}-${c.id}`}
      emptyMessage={emptyMessage}
    />
  )
}
