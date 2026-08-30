import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button, Modal, Table } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import { isApiError } from '@/shared/api/ApiError'
import { useToast } from '@/app/providers/ToastContext'
import { useSuppliers } from '../api/useSuppliers'
import { useDeleteSuppliers } from '../api/useDeleteSuppliers'
import type { Supplier } from '../types/supplier'

// Chequea trim() y no solo `??`: un campo que el usuario vacio llega como ''
// (no undefined), y con `??` la celda quedaba en blanco en vez del guion.
function orDash(value?: string) {
  return value?.trim() ? value : <span className="table__td--muted">—</span>
}

export function SuppliersPage() {
  const { data, isPending, error } = useSuppliers()
  const [search, setSearch] = useState('')

  // null = mirando la lista. Un Set, aunque este vacio = modo eliminacion.
  // En un solo estado para que no exista "modo activo sin seleccion".
  const [selected, setSelected] = useState<Set<number> | null>(null)
  const isSelecting = selected !== null
  const selectedCount = selected?.size ?? 0

  const [confirmOpen, setConfirmOpen] = useState(false)
  const { mutate: deleteSuppliers, isPending: isDeleting } = useDeleteSuppliers()
  const showToast = useToast()

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

  function toggleOne(id: number) {
    setSelected((current) => {
      if (!current) return current
      // Copia obligatoria: mutar el Set del estado no dispara re-render,
      // porque React compara por referencia y seria el mismo objeto.
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  // Opera sobre lo filtrado: con una busqueda activa, "todos" son esos.
  // El length > 0 evita que una lista vacia cuente como toda seleccionada.
  const allVisibleSelected =
    selected !== null && filtered.length > 0 && filtered.every((s) => selected.has(s.id))

  // Sale de `data` y no de `filtered`: la seleccion sobrevive a la busqueda,
  // asi que puede incluir proveedores que el filtro actual no muestra.
  const selectedSuppliers = (data ?? []).filter((s) => selected?.has(s.id))

  // Tildados que quedaron fuera de la busqueda. Si hay, se avisa en la barra:
  // sin eso el usuario borraria cosas que no tiene delante.
  const hiddenSelectedCount = selectedSuppliers.filter(
    (s) => !filtered.some((f) => f.id === s.id),
  ).length

  function toggleAllVisible() {
    setSelected((current) => {
      if (!current) return current
      const next = new Set(current)
      if (allVisibleSelected) filtered.forEach((s) => next.delete(s.id))
      else filtered.forEach((s) => next.add(s.id))
      return next
    })
  }

  function handleDelete() {
    // El spread convierte el Set en el number[] que espera la mutacion.
    const ids = [...(selected ?? [])]

    deleteSuppliers(ids, {
      onSuccess: ({ deleted, failed }) => {
        setConfirmOpen(false)

        if (failed.length === 0) {
          // Salio todo: cerramos el modo eliminacion.
          setSelected(null)
          showToast(
            'success',
            deleted.length === 1
              ? 'Proveedor eliminado.'
              : `${deleted.length} proveedores eliminados.`,
          )
          return
        }

        // Seguimos en modo eliminacion con los fallidos tildados: se ve
        // cuales estan en uso y se reintenta sin volver a buscarlos.
        setSelected(new Set(failed))

        if (deleted.length === 0) {
          showToast(
            'error',
            'No se pudo eliminar: puede que estén en uso en otros registros.',
          )
        } else {
          showToast(
            'error',
            `${deleted.length} eliminados. ${failed.length} no se pudieron ` +
              'eliminar porque están en uso.',
          )
        }
      },
      onError: (mutationError) => {
        setConfirmOpen(false)
        showToast(
          'error',
          isApiError(mutationError)
            ? mutationError.message
            : 'Ocurrió un error inesperado.',
        )
      },
    })
  }

  // Las columnas se arman adentro del componente porque la de seleccion
  // depende del estado; antes eran una constante de modulo.
  const selectionColumn: Column<Supplier> = {
    // Sin titulo: el "seleccionar todos" vive en la barra, donde el texto
    // no obliga a ensanchar esta columna en todas las filas.
    header: '',
    align: 'center',
    render: (s) => (
      <input
        type="checkbox"
        className="table__checkbox"
        checked={selected?.has(s.id) ?? false}
        onChange={() => toggleOne(s.id)}
        aria-label={`Seleccionar ${s.legalName}`}
      />
    ),
  }

  const columns: Column<Supplier>[] = [
    // El spread de un array vacio no agrega nada: asi se mete una columna
    // condicionalmente sin romper el array literal.
    ...(isSelecting ? [selectionColumn] : []),
    { header: 'Razón social', render: (s) => s.legalName },
    { header: 'CUIT', render: (s) => s.taxId },
    { header: 'Tipo', render: (s) => s.supplierType },
    { header: 'Contacto', render: (s) => orDash(s.contactName) },
    { header: 'Teléfono', render: (s) => orDash(s.contactPhone) },
    // En modo eliminación no hay "Ver": navegar desmonta la pantalla y la
    // selección se perdería sin ningún aviso.
    ...(isSelecting
      ? []
      : [
          {
            header: '',
            align: 'center' as const,
            render: (s: Supplier) => (
              <Link className="table__action" to={`/catalogs/suppliers/${s.id}`}>
                Ver
              </Link>
            ),
          },
        ]),
  ]

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

        {/* En modo eliminación las acciones las toma la barra de abajo. */}
        {!isSelecting && (
          <div className="content__actions">
            <Button
              variant="outline"
              onClick={() => setSelected(new Set())}
              disabled={(data?.length ?? 0) === 0}
            >
              Eliminar proveedores
            </Button>
            <Link to="/catalogs/suppliers/new" className="btn btn--primary content__cta">
              <span>+</span> Nuevo proveedor
            </Link>
          </div>
        )}
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

      {isSelecting && (
        <div className="bulk-bar" role="region" aria-live="polite">
          <div className="bulk-bar__left">
            {/* <label> envolviendo el input: el texto tambien alterna la casilla. */}
            <label className="bulk-bar__select-all">
              <input
                type="checkbox"
                className="table__checkbox"
                checked={allVisibleSelected}
                onChange={toggleAllVisible}
                disabled={filtered.length === 0}
              />
              Seleccionar todos
            </label>

            <span className="bulk-bar__count">
              {selectedCount === 1
                ? '1 proveedor seleccionado'
                : `${selectedCount} proveedores seleccionados`}
            </span>

            {/* Avisa que hay tildados que el filtro actual no muestra. */}
            {hiddenSelectedCount > 0 && (
              <span className="bulk-bar__hint">
                ({hiddenSelectedCount} fuera de la búsqueda)
              </span>
            )}
          </div>
          <div className="bulk-bar__actions">
            <Button variant="outline" onClick={() => setSelected(null)}>
              Cancelar
            </Button>
            {/* Deshabilitado sin selección: el contador de al lado explica por qué. */}
            <Button
              variant="danger"
              onClick={() => setConfirmOpen(true)}
              disabled={selectedCount === 0}
            >
              Confirmar
            </Button>
          </div>
        </div>
      )}

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

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Eliminar proveedores"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p>
          {selectedCount === 1
            ? 'Vas a eliminar este proveedor:'
            : `Vas a eliminar estos ${selectedCount} proveedores:`}
        </p>

        {/* Listados y no contados: la seleccion puede incluir proveedores
            fuera de la busqueda, y un "vas a eliminar 2" dejaba borrar a ciegas. */}
        <ul className="confirm-list">
          {selectedSuppliers.map((s) => (
            <li key={s.id}>{s.legalName}</li>
          ))}
        </ul>

        <p className="confirm-warning">Esta acción no se puede deshacer.</p>
      </Modal>
    </>
  )
}
