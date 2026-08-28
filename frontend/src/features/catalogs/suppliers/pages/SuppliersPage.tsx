import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Badge, Table } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import { isApiError } from '@/shared/api/ApiError'
import { useSuppliers } from '../api/useSuppliers'
import type { Supplier } from '../types/supplier'

/** Los campos opcionales del contrato pueden venir vacíos: mostramos un guión. */
function orDash(value?: string) {
  return value ?? <span className="table__td--muted">—</span>
}

/**
 * Vuelven a estar fuera del componente: ninguna columna depende de nada de
 * adentro. Editar ya no se dispara desde acá, se hace en la pantalla de
 * detalle, así que la columna de acciones solo navega.
 */
const columns: Column<Supplier>[] = [
  { header: 'Razón social', render: (s) => s.legalName },
  { header: 'CUIT', render: (s) => s.taxId },
  { header: 'Tipo', render: (s) => s.supplierType },
  { header: 'Contacto', render: (s) => orDash(s.contactName) },
  { header: 'Teléfono', render: (s) => orDash(s.contactPhone) },
  {
    header: 'Estado',
    align: 'center',
    render: (s) =>
      s.active ? (
        <Badge variant="si">Activo</Badge>
      ) : (
        <Badge variant="pendiente">Inactivo</Badge>
      ),
  },
  {
    header: '',
    align: 'center',
    render: (s) => (
      <Link className="table__action" to={`/catalogs/suppliers/${s.id}`}>
        Ver
      </Link>
    ),
  },
]

export function SuppliersPage() {
  const { data, isPending, error } = useSuppliers()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const list = data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return list
    return list.filter((s) =>
      [
        s.legalName,
        s.taxId,
        s.taxId.replace(/-/g, ''), // Para buscar sin los guiones
        s.supplierType,
        s.contactName ?? '',
      ].some((field) => field.toLowerCase().includes(term)),
    )
  }, [data, search])

  // El mensaje del cuerpo vacío cambia según por qué está vacío.
  let emptyMessage = 'Todavía no hay proveedores registrados.'
  if (isPending) emptyMessage = 'Cargando proveedores…'
  else if (search.trim()) emptyMessage = `No encontramos proveedores para "${search.trim()}".`

  return (
    <>
      <div className="content__heading">
        <div>
          <h1 className="content__title">Proveedores</h1>
          <p className="content__subtitle">
            {isPending ? 'Cargando…' : `${data?.length ?? 0} Proveedores registrados`}
          </p>
        </div>

        <Link to="/catalogs/suppliers/new" className="btn btn--primary content__cta">
          <span>+</span> Nuevo proveedor
        </Link>
      </div>

      <div className="filters">
        <label className="filters__search filters__search--wide">
          <svg
            className="filters__search-icon"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <circle cx="9" cy="9" r="6" />
            <path d="m14 14 4 4" strokeLinecap="round" />
          </svg>
          <input
            className="filters__search-input"
            type="search"
            placeholder="Buscar por razón social, CUIT, Contacto o Tipo Proveedor"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Buscar proveedores"
          />
        </label>
      </div>

      {error ? (
        <div className="callout callout--warning">
          <span>{isApiError(error) ? error.message : 'Ocurrió un error inesperado.'}</span>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          rowKey={(s) => s.id}
          emptyMessage={emptyMessage}
        />
      )}
    </>
  )
}
