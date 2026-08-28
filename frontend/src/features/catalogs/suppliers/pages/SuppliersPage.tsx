import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Badge, Button, Modal, Table, Input } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import { isApiError } from '@/shared/api/ApiError'
import { useSuppliers } from '../api/useSuppliers'
import type { Supplier } from '../types/supplier'

/** Los campos opcionales del contrato pueden venir vacíos: mostramos un guión. */
function orDash(value?: string) {
  return value ?? <span className="table__td--muted">—</span>
}
function buildColumns(onEdit: (supplier: Supplier) => void): Column<Supplier>[] {
  return [
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
      <>
        <Link className="table__action" to={`/catalogs/suppliers/${s.id}`}>
          Ver
        </Link>
        <span className="table__action-sep">|</span>
        <button type="button" className="table__action" onClick={() => onEdit(s)}>
          Editar
        </button>
      </>
    ),
  },
]
}
export function SuppliersPage() {
  const {data, isPending, error} = useSuppliers()
  const [search, setSearch] = useState("")
  const [editing, setEditing] = useState<Supplier | null>(null)
  const columns = useMemo(() => buildColumns(setEditing), [])

  const filtered = useMemo(() => {
    const list = data ?? []
    const term = search.trim().toLowerCase()
    if (!term) return list
    return list.filter((s) => [
      s.legalName,
      s.taxId,
      s.taxId.replace(/-/g, ''),//Para buscar sin los guiones 
      s.supplierType,
      s.contactName ?? "",
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
            {isPending
              ? 'Cargando…'
              : `${data?.length ?? 0} Proveedores registrados`}
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
          <span>
            {isApiError(error) ? error.message : 'Ocurrió un error inesperado.'}
          </span>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filtered}
          rowKey={(s) => s.id}
          emptyMessage={emptyMessage}
        />
      )}
            <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Editar proveedor"
        footer={
          <>
            <button
              type="button"
              className="modal__cancel"
              onClick={() => setEditing(null)}
            >
              Cancelar
            </button>
            <Button variant="primary" disabled>
              Guardar cambios
            </Button>
          </>
        }
      >
          {editing && (
          <form key={editing.id} className="form-grid">
            <Input
              id="legalName"
              label="Razón social"
              defaultValue={editing.legalName}
            />

            <div className="form-field">
              <label className="form-field__label" htmlFor="taxId">
                CUIT
              </label>
              <input
                id="taxId"
                className="form-field__input form-field__input--disabled"
                defaultValue={editing.taxId}
                disabled
              />
              <span className="form-field__hint">
                El CUIT no se puede modificar.
              </span>
            </div>

            <div className="form-field">
              <label className="form-field__label" htmlFor="supplierType">
                Tipo
              </label>
              <select
                id="supplierType"
                className="form-field__select"
                defaultValue={editing.supplierType}
              >
                <option value="Tercerizado">Tercerizado</option>
                <option value="Material">Material</option>
                <option value="Repuesto">Repuesto</option>
                <option value="Pintura">Pintura</option>
              </select>
            </div>

            <Input
              id="contactName"
              label="Contacto"
              defaultValue={editing.contactName ?? ''}
            />
            <Input
              id="contactEmail"
              label="Email"
              type="email"
              defaultValue={editing.contactEmail ?? ''}
            />
            <Input
              id="contactPhone"
              label="Teléfono"
              defaultValue={editing.contactPhone ?? ''}
            />

            <div className="form-field form-field--full">
              <label className="form-field__label" htmlFor="address">
                Dirección
              </label>
              <input
                id="address"
                className="form-field__input"
                defaultValue={editing.address ?? ''}
              />
            </div>
          </form>
        )}
      </Modal>
    </>
  )
}