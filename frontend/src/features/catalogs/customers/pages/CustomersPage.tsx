import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button, IconTrash, Modal } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Customer } from '../types/customer'
import {
  useCustomers,
  useDeactivateCustomer,
  useFactories,
  useCategories,
} from '../api/customers.queries'
import { CustomersTable } from '../components/CustomersTable'
import { customerErrorMessage, customerFullName } from '../utils/errorMessages'

/** Tamaño de página del listado global (coincide con el default del backend). */
const PAGE_SIZE = 20

/** CU-03 Consultar Cliente + CU-04 Registrar/Deshacer Baja de Cliente. */
export function CustomersPage() {
  const showToast = useToast()
  const { data: factories = [] } = useFactories()
  const { data: categories = [] } = useCategories()
  const deactivate = useDeactivateCustomer()

  // Customer pending confirmation for baja lógica; null when the modal is closed.
  const [toDeactivate, setToDeactivate] = useState<Customer | null>(null)

  // Buscador global de encargados por nombre o apellido (HU escenario 2). El
  // backend hace la búsqueda; se debouncea para no pegarle en cada tecla.
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  // Al cambiar la búsqueda volvemos a la primera página;
  // se hace en los handlers (no en un effect) para no encadenar renders.
  const handleSearchChange = (value: string) => {
    setSearch(value)
    setPage(1)
  }

  // El backend filtra y pagina; los eliminados nunca se listan.
  const customersQuery = useCustomers({
    nameContains: debouncedSearch || undefined,
    active: true,
    page,
    limit: PAGE_SIZE,
  })

  const customers = customersQuery.data?.items ?? []
  const total = customersQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const fullName = (c: Customer) => customerFullName(c)

  const confirmDeactivate = () => {
    if (!toDeactivate) return
    deactivate.mutate(
      { factoryId: toDeactivate.factoryId, id: toDeactivate.id },
      {
        onSuccess: () => {
          // 'info' y no 'success', igual que en Proveedores: salió bien,
          // pero el verde de éxito para un borrado se lee como si
          // hubiéramos ganado algo.
          showToast(
            'info',
            `Encargado "${fullName(toDeactivate)}" eliminado.`,
          )
          setToDeactivate(null)
        },
        onError: (error) => {
          showToast(
            'error',
            customerErrorMessage(error, 'No se pudo eliminar el encargado.'),
          )
        },
      },
    )
  }

  return (
    <>
      {/* Rediseño: el encabezado pasa a ser el panel azul, el mismo de
          Fábricas y Proveedores. Cambia la envoltura y las clases; los
          textos, el botón y el link son los de antes. Los filtros se
          mudan acá adentro (ver más abajo). */}
      <div className="page-header">
        <div className="page-header__row">
          <div className="page-header__heading">
            <span className="page-header__eyebrow">Catálogo</span>
            <h1 className="page-header__title">Encargados</h1>
            <p className="page-header__subtitle">
              Alta, baja, modificación y consulta de encargados de fábricas.
            </p>
          </div>
          <div className="content__actions">
            <Link to="/catalogos/encargados/nuevo" className="btn btn--primary content__cta">
              <span>+</span> Nuevo encargado
            </Link>
          </div>
        </div>

        {customersQuery.isSuccess && (
          <div className="page-header__filters">
            <label className="search-field">
              <svg
                className="search-field__icon"
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
                type="search"
                className="search-input"
                placeholder="Buscar por nombre o apellido"
                aria-label="Buscar por nombre o apellido"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
              />
            </label>

          </div>
        )}
      </div>

      {customersQuery.isLoading && (
        <div className="empty-state">
          <p className="empty-state__text">Cargando encargados…</p>
        </div>
      )}

      {customersQuery.isError && (
        <div className="callout callout--warning">
          <span>
            {isApiError(customersQuery.error)
              ? customersQuery.error.message
              : 'No se pudieron cargar los encargados.'}
          </span>
        </div>
      )}

      {customersQuery.isSuccess && (
        <>
          <CustomersTable
            customers={customers}
            factories={factories}
            categories={categories}
            onDeactivate={setToDeactivate}
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
            {/* danger y no primario: confirmar un borrado va en rojo, como
                en Proveedores. El tacho abre la tapa al pasar el mouse. */}
            <Button variant="danger" onClick={confirmDeactivate} disabled={deactivate.isPending}>
              <IconTrash />
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
