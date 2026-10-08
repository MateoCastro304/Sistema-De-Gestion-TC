import { Link } from 'react-router'
import { Avatar, Badge, Table, TrashButton, ValueOrDash } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import { toneByStatus } from '@/shared/lib/rowTone'
import { cn } from '@/shared/lib/cn'
import type { Customer } from '../types/customer'
import type { Factory } from '../types/factory'
import type { Category } from '../types/category'
import { customerFullName } from '../utils/errorMessages'

interface CustomersTableProps {
  customers: Customer[]
  factories: Factory[]
  categories: Category[]
  /** Called when the user confirms the baja lógica of a customer. */
  onDeactivate: (customer: Customer) => void
  /** Message shown when there are no rows (e.g. no matches for the search). */
  emptyMessage?: string
}

/** Read-only listing of customers/contacts (CU-03), with links to detail and baja. */
export function CustomersTable({
  customers,
  factories,
  categories,
  onDeactivate,
  emptyMessage = 'No hay encargados registrados.',
}: CustomersTableProps) {
  const factoryById = (id: string) => factories.find((f) => f.id === id)
  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? '—'

  const columns: Column<Customer>[] = [
    {
      header: 'Nombre',
      render: (c) => (
        <span className="table__cell--nombre">
          <Avatar name={customerFullName(c)} tone={toneByStatus(c.isActive)} />
          <b>
            {customerFullName(c)}
          </b>
          {/* La etiqueta se queda además de la franja gris: el color solo
              distingue, la palabra explica. */}
          {!c.isActive && <Badge variant="neutral">Inactivo</Badge>}
        </span>
      ),
    },
    {
      header: 'Teléfono',
      render: (c) => <ValueOrDash value={c.phone} className="table__cell--mono" />,
    },
    {
      header: 'Email',
      // Un mail no se parte: si no entra se corta con "…" y el title
      // muestra el completo al pasar el mouse.
      render: (c) => (
        <span className="table__cell--email" title={c.mail || undefined}>
          <ValueOrDash value={c.mail} />
        </span>
      ),
    },
    {
      header: 'Fábrica',
      render: (c) => (
        <ValueOrDash value={factoryById(c.factoryId)?.name} className="table__cell--contacto" />
      ),
    },
    {
      header: 'Rubro',
      render: (c) => {
        const factory = factoryById(c.factoryId)
        return factory ? <Badge variant="suave">{categoryName(factory.categoryId)}</Badge> : <ValueOrDash />
      },
    },
    {
      header: '',
      align: 'center',
      cellClassName: 'table__cell--acciones',
      render: (c) => (
        <>
          <Link className="link-btn" to={`/catalogos/encargados/${c.factoryId}/${c.id}`}>
            Ver
          </Link>
          {/* Eliminar va como ícono y no como segundo botón: borrar no
              puede pesar visualmente lo mismo que ver el detalle. */}
          {c.isActive && (
            <TrashButton
              label={`Eliminar a ${customerFullName(c)}`}
              onClick={() => onDeactivate(c)}
            />
          )}
        </>
      ),
    },
  ]

  return (
    <Table
      /* Rediseño: filas-tarjeta en vez de <table>. Los datos, el filtro y
         el rowKey son los mismos; lo nuevo son sólo props de presentación. */
      variant="cards"
      /* Teléfono, rubro y acciones van fijos: el teléfono no se parte
         (nowrap) y con 1.4fr se montaba sobre el email. */
      gridTemplate="minmax(0,1.7fr) 150px minmax(0,1.2fr) minmax(0,1fr) 130px 150px"
      rowClassName={(c) => cn(`table__row--${toneByStatus(c.isActive)}`)}
      columns={columns}
      data={customers}
      rowKey={(c) => `${c.factoryId}-${c.id}`}
      emptyMessage={emptyMessage}
    />
  )
}
