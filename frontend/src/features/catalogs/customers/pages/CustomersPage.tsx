import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Button, IconTrash, Modal, PageHero, Pagination, SearchField } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import fotoTaller from '@/assets/foto-cnc.webp'
import { PANELS } from '@/features/catalogs/panels'
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

  // "Limpiar búsqueda" no espera al debounce: el botón ya dijo qué quiere.
  const clearSearch = () => {
    handleSearchChange('')
    setDebouncedSearch('')
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
      <PageHero
        eyebrow="Contactos de"
        accent="fábricas"
        title="Encargados"
        photo={fotoTaller}
        photoPosition="center 55%"
        back={{ to: PANELS.clientes.to, label: PANELS.clientes.label }}
      >
        {customersQuery.isLoading ? (
          'Cargando…'
        ) : (
          <>
            {/* Con una búsqueda activa el total es el de los que coinciden,
                no el del catálogo entero: el texto lo dice. */}
            <strong>{total}</strong>{' '}
            {debouncedSearch
              ? total === 1
                ? 'encargado coincide con la búsqueda'
                : 'encargados coinciden con la búsqueda'
              : total === 1
                ? 'encargado activo'
                : 'encargados activos'}
          </>
        )}
      </PageHero>

      {/* Barra de herramientas: buscador y alta. El buscador aparece
          recién cuando el listado cargó. */}
      <div className="toolbar">
        {customersQuery.isSuccess && (
          <SearchField
            value={search}
            onChange={handleSearchChange}
            placeholder="Buscar por nombre o apellido"
          />
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
