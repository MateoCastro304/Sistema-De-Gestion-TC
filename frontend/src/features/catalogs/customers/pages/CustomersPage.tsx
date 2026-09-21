import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button, Modal } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Customer } from '../types/customer'
import {
  useActivateCustomer,
  useCustomers,
  useDeactivateCustomer,
  useFactories,
  useIndustries,
} from '../api/customers.queries'
import { CustomersTable } from '../components/CustomersTable'

/** Tamaño de página del listado global (coincide con el default del backend). */
const PAGE_SIZE = 20

/** CU-03 Consultar Cliente + CU-04 Registrar/Deshacer Baja de Cliente. */
export function CustomersPage() {
  const showToast = useToast()
  const { data: factories = [] } = useFactories()
  const { data: industries = [] } = useIndustries()
  const deactivate = useDeactivateCustomer()
  const activate = useActivateCustomer()

  // Customer pending confirmation for baja lógica; null when the modal is closed.
  const [toDeactivate, setToDeactivate] = useState<Customer | null>(null)

  // Buscador global de encargados por nombre o apellido (HU escenario 2). El
  // backend hace la búsqueda; se debouncea para no pegarle en cada tecla.
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  // Regla de negocio: los inactivos se muestran solo si se activa este filtro.
  const [showInactive, setShowInactive] = useState(false)
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Al cambiar la búsqueda o el filtro de inactivos volvemos a la primera página;
  // se hace en los handlers (no en un effect) para no encadenar renders.
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  const handleShowInactiveChange = (checked: boolean) => {
    setShowInactive(checked)
    setPage(1)
  }

  // El backend filtra y pagina; sin `active` trae activos + inactivos.
  const customersQuery = useCustomers({
    nameContains: debouncedSearch || undefined,
    active: showInactive ? undefined : true,
    page,
    limit: PAGE_SIZE,
  })

  const customers = customersQuery.data?.items ?? []
  const total = customersQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fullName = (c: Customer) => `${c.firstName} ${c.lastName}`

  const handleActivate = (customer: Customer) => {
    activate.mutate(
      { factoryId: customer.factoryId, id: customer.id },
      {
        onSuccess: () =>
          showToast('success', `Encargado "${fullName(customer)}" reactivado.`),
        onError: (error) =>
          showToast(
            'error',
            isApiError(error) ? error.message : 'No se pudo reactivar el encargado.',
          ),
      },
    )
  }

  const confirmDeactivate = () => {
    if (!toDeactivate) return
    deactivate.mutate(
      { factoryId: toDeactivate.factoryId, id: toDeactivate.id },
      {
        onSuccess: () => {
          showToast(
            'success',
            `Encargado "${fullName(toDeactivate)}" eliminado.`,
          )
          setToDeactivate(null)
        },
        onError: (error) => {
          showToast(
            'error',
            isApiError(error)
              ? error.message
              : 'No se pudo eliminar el encargado.',
          )
        },
      },
    )
  }

  return (
    <>
      <div className="content__heading">
        <div>
          <h1 className="content__title">Encargados</h1>
          <p className="content__subtitle">
            Alta, baja, modificación y consulta de encargados de fábricas.
          </p>
        </div>
        <Link to="/catalogos/encargados/nuevo">
          <Button>+ Nuevo encargado</Button>
        </Link>
      </div>

      {customersQuery.isLoading && <p>Cargando encargados…</p>}

      {customersQuery.isError && (
        <p className="form-field__hint--error">
          {isApiError(customersQuery.error)
            ? customersQuery.error.message
            : 'No se pudieron cargar los encargados.'}
        </p>
      )}

      {customersQuery.isSuccess && (
        <>
          <div className="filters">
            <div className="filters__search">
              <svg
                className="filters__search-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="search"
                className="filters__search-input"
                placeholder="Buscar por nombre o apellido"
                aria-label="Buscar por nombre o apellido"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </div>

            <label className="filters__checkbox">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => handleShowInactiveChange(event.target.checked)}
              />
              Incluir eliminados
            </label>
          </div>

          <CustomersTable
            customers={customers}
            factories={factories}
            industries={industries}
            onDeactivate={setToDeactivate}
            onActivate={handleActivate}
            emptyMessage={
              debouncedSearch !== ''
                ? 'No hay encargados que coincidan con la búsqueda.'
                : 'No hay encargados registrados.'
            }
          />

          {totalPages > 1 && (
            <div className="pagination">
              <Button
                variant="outline"
                disabled={page <= 1 || customersQuery.isFetching}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <span className="pagination__status">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages || customersQuery.isFetching}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      <Modal
        open={toDeactivate !== null}
        onClose={() => setToDeactivate(null)}
        title="Eliminar encargado"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setToDeactivate(null)}
              disabled={deactivate.isPending}
            >
              Cancelar
            </Button>
            <Button onClick={confirmDeactivate} disabled={deactivate.isPending}>
              {deactivate.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p>
          ¿Seguro que querés eliminar a{' '}
          <strong>{toDeactivate ? fullName(toDeactivate) : ''}</strong>? El
          encargado se eliminará, pero se conserva su historial.
        </p>
      </Modal>
    </>
  )
}
