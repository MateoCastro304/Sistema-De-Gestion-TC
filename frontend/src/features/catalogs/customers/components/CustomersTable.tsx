import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Avatar, Badge, EntityIcon, Table, TrashButton, ValueOrDash } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import { toneByStatus } from '@/shared/lib/rowTone'
import { cn } from '@/shared/lib/cn'
import { formatPhone } from '@/shared/lib/formatPhone'
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
  /** Qué mostrar si no hay filas: sin registros, sin resultados o error. */
  emptyState?: ReactNode
  /** Pie del listado (la paginación). */
  footer?: ReactNode
}

/** Read-only listing of customers/contacts (CU-03), with links to detail and baja. */
export function CustomersTable({
  customers,
  factories,
  categories,
  onDeactivate,
  emptyState,
  footer,
}: CustomersTableProps) {
  const factoryById = (id: string) => factories.find((f) => f.id === id)
  const categoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? '—'

  const columns: Column<Customer>[] = [
    {
      header: 'Nombre',
      render: (c) => (
        <span className="table__cell--nombre">
          <Avatar name={customerFullName(c)} icon="encargado" tone={toneByStatus(c.isActive)} shape="round" />
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
      render: (c) => <ValueOrDash value={formatPhone(c.phone)} className="table__cell--mono" />,
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
      render: (c) => {
        const name = factoryById(c.factoryId)?.name
        return name ? (
          <span className="cell-icon table__cell--contacto">
            <EntityIcon name="fabrica" />
            <span className="cell-icon__text">{name}</span>
          </span>
        ) : (
          <ValueOrDash />
        )
      },
    },
    {
      header: 'Rubro',
      render: (c) => {
        const factory = factoryById(c.factoryId)
        return factory ? (
          <span className="cell-icon cell-icon--soft">
            <EntityIcon name="rubro" />
            {categoryName(factory.categoryId)}
          </span>
        ) : (
          <ValueOrDash />
        )
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
      /* Las columnas del prototipo: teléfono, fábrica, rubro y acciones
         van fijos; nombre y email se reparten el resto. */
      gridTemplate="minmax(0,1.4fr) 220px minmax(0,1.3fr) 150px 140px 190px"
      rowClassName={(c) => cn(`table__row--${toneByStatus(c.isActive)}`)}
      // Tocar la fila abre el detalle, igual que "Ver".
      rowHref={(c) => `/catalogos/encargados/${c.factoryId}/${c.id}`}
      columns={columns}
      data={customers}
      rowKey={(c) => `${c.factoryId}-${c.id}`}
      emptyState={emptyState}
      footer={footer}
    />
  )
}
