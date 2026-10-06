import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Button, CheckBox, IconTrash, Modal } from '@/shared/components/ui'
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
            <Link to="/catalogs/customers/new" className="btn btn--primary content__cta">
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
                placeholder="Buscar por nombre, apellido, mail o fábrica"
                aria-label="Buscar por nombre, apellido, mail o fábrica"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>

            {/* El <label> envuelve al input, así que el texto también
                alterna la casilla. CheckBox sólo cambia el aspecto: el
                input nativo sigue adentro con su mismo onChange. */}
            <label className="filter-check">
              <CheckBox
                checked={showInactive}
                onChange={() => setShowInactive(!showInactive)}
              />
              Incluir eliminados
            </label>
          </div>
        )}
      </div>

      {customersQuery.isLoading && <p>Cargando encargados…</p>}

      {customersQuery.isError && (
        <p className="form-field__error">
          {isApiError(customersQuery.error)
            ? customersQuery.error.message
            : 'No se pudieron cargar los encargados.'}
        </p>
      )}

      {customersQuery.isSuccess && (
        <>
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
