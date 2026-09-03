import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button, Modal } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Customer } from '../types/customer'
import {
  useCustomers,
  useDeactivateCustomer,
  useFactories,
  useIndustries,
} from '../api/customers.queries'
import { CustomersTable } from '../components/CustomersTable'

/** CU-03 Consultar Cliente + CU-04 Registrar Baja de Cliente. */
export function CustomersPage() {
  const showToast = useToast()
  // Traemos también los inactivos; el filtro de abajo decide si se muestran.
  const customersQuery = useCustomers({ includeInactive: true })
  const { data: factories = [] } = useFactories()
  const { data: industries = [] } = useIndustries()
  const deactivate = useDeactivateCustomer()

  // Customer pending confirmation for baja lógica; null when the modal is closed.
  const [toDeactivate, setToDeactivate] = useState<Customer | null>(null)

  // Buscador global de encargados (HU escenario 2): texto libre sobre nombre,
  // apellido, mail y la fábrica a la que pertenece, para identificar rápido con
  // quién comunicarse ante una solicitud o entrega.
  const [search, setSearch] = useState('')
  // Regla de negocio: los inactivos se muestran solo si se activa este filtro.
  const [showInactive, setShowInactive] = useState(false)

  const fullName = (c: Customer) => `${c.firstName} ${c.lastName}`

  const factoryName = (id: string) =>
    factories.find((f) => f.id === id)?.name ?? ''

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase()
    const base = customersQuery.data ?? []
    return base.filter((c) => {
      if (!showInactive && !c.isActive) return false
      if (!query) return true
      const haystack = [
        c.firstName,
        c.lastName,
        c.mail,
        factoryName(c.factoryId),
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(query)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customersQuery.data, factories, search, showInactive])

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
        <Link to="/catalogs/customers/new">
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
                placeholder="Buscar por nombre, apellido, mail o fábrica"
                aria-label="Buscar por nombre, apellido, mail o fábrica"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>

            <label className="filters__checkbox">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
              />
              Mostrar inactivos
            </label>
          </div>

          <CustomersTable
            customers={filteredCustomers}
            factories={factories}
            industries={industries}
            onDeactivate={setToDeactivate}
            emptyMessage={
              search.trim() !== ''
                ? 'No hay encargados que coincidan con la búsqueda.'
                : 'No hay encargados registrados.'
            }
          />
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
