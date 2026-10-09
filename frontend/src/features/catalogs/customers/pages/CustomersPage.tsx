import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import {
  Button,
  CheckBox,
  IconTrash,
  Modal,
  PageHero,
  Pagination,
  SearchField,
} from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import fotoTaller from '@/assets/foto-cnc.webp'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Customer } from '../types/customer'
import {
  useActivateCustomer,
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

  // "Limpiar búsqueda" no espera al debounce: el botón ya dijo qué quiere.
  const clearSearch = () => {
    handleSearchChange('')
    setDebouncedSearch('')
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

  const fullName = (c: Customer) => customerFullName(c)

  const handleActivate = (customer: Customer) => {
    activate.mutate(
      { factoryId: customer.factoryId, id: customer.id },
      {
        onSuccess: () =>
          showToast('success', `Encargado "${fullName(customer)}" reactivado.`),
        onError: (error) =>
          showToast(
            'error',
            customerErrorMessage(error, 'No se pudo reactivar el encargado.'),
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
      <PageHero eyebrow="Contactos de" accent="fábricas" title="Encargados" photo={fotoTaller} />

      {/* Barra de herramientas: buscador, filtro y alta. Los filtros
          aparecen recién cuando el listado cargó. */}
      <div className="toolbar">
        {customersQuery.isSuccess && (
          <>
            <SearchField
              value={search}
              onChange={handleSearchChange}
              placeholder="Buscar por nombre o apellido"
            />

            {/* El <label> envuelve al input, así que el texto también
                alterna la casilla. */}
            <label className="filter-check">
              <CheckBox
                checked={showInactive}
                onChange={() => handleShowInactiveChange(!showInactive)}
              />
              Incluir eliminados
            </label>
          </>
        )}
        <Link to="/catalogos/encargados/nuevo" className="btn btn--primary toolbar__cta">
          + Nuevo encargado
        </Link>
      </div>

      {customersQuery.isLoading && (
        <div className="empty-state">
          <p className="empty-state__text">Cargando encargados…</p>
        </div>
      )}

      {/* El error va dentro de la misma tarjeta del listado, con el
          encabezado de columnas a la vista: se lee como "acá iba la
          lista", no como un cartel suelto. */}
      {customersQuery.isError && (
        <CustomersTable
          customers={[]}
          factories={factories}
          categories={categories}
          onDeactivate={setToDeactivate}
          emptyState={
            <EmptyState
              kind="error"
              title="No se pudieron cargar los encargados."
              action={<Button onClick={() => customersQuery.refetch()}>Reintentar</Button>}
            >
              {isApiError(customersQuery.error)
                ? customersQuery.error.message
                : 'Revisá la conexión e intentá de nuevo.'}
            </EmptyState>
          }
        />
      )}

      {customersQuery.isSuccess && (
        <CustomersTable
          customers={customers}
          factories={factories}
          categories={categories}
          onDeactivate={setToDeactivate}
          onActivate={handleActivate}
          emptyState={
            debouncedSearch !== '' ? (
              <EmptyState
                kind="no-results"
                title="No hay encargados que coincidan con la búsqueda."
                action={
                  <Button variant="secondary" onClick={clearSearch}>
                    Limpiar búsqueda
                  </Button>
                }
              >
                Revisá cómo está escrito o probá con el apellido.
              </EmptyState>
            ) : (
              <EmptyState
                title="Todavía no hay encargados registrados."
                action={
                  <Link to="/catalogos/encargados/nuevo" className="btn btn--primary">
                    + Nuevo encargado
                  </Link>
                }
              >
                Cuando cargues el primero va a aparecer acá.
              </EmptyState>
            )
          }
          footer={
            <Pagination
              page={page}
              pageSize={PAGE_SIZE}
              total={total}
              onPageChange={setPage}
              // Con keepPreviousData la página vieja sigue a la vista
              // mientras llega la nueva: se bloquea para no encolar saltos.
              disabled={customersQuery.isFetching}
            />
          }
        />
      )}

      <Modal
        open={toDeactivate !== null}
        onClose={() => setToDeactivate(null)}
        title="Eliminar encargado"
        tone="danger"
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
