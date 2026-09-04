import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router'
import { Badge, Button, Modal, Table } from '@/shared/components/ui'
import type { Column } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Customer } from '../types/customer'
import type { Factory, FactoryInput } from '../types/factory'
import { formatCuit, toFactoryFormValues } from '../schemas/factory.schema'
import {
  useCustomers,
  useDeactivateCustomer,
  useFactories,
  useIndustries,
  useUpdateFactory,
} from '../api/customers.queries'
import { FactoryForm } from '../components/FactoryForm'
import { CustomerFormModal } from '../components/CustomerFormModal'

/**
 * CU-60 Consultar Fábrica (read-only) with an "Editar" toggle for CU-59
 * Modificar Fábrica, plus the list of its encargados: from here you can add,
 * edit or deactivate the contacts that belong to this factory.
 */
export function FactoryDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const location = useLocation()
  const showToast = useToast()

  const factoriesQuery = useFactories()
  const { data: industries = [] } = useIndustries()
  // Traemos también los inactivos; el filtro decide si se muestran.
  const customersQuery = useCustomers({ includeInactive: true })
  const update = useUpdateFactory(id)
  const deactivate = useDeactivateCustomer()

  const [editing, setEditing] = useState(false)
  // Regla de negocio: los encargados inactivos se muestran solo con este filtro.
  const [showInactive, setShowInactive] = useState(false)
  // Encargado modal: null closed; { customer } edits; { customer: undefined } adds.
  const [contactModal, setContactModal] = useState<{
    customer?: Customer
  } | null>(null)
  // Encargado pending confirmation for baja lógica.
  const [toDeactivate, setToDeactivate] = useState<Customer | null>(null)

  // Escenario 1 (HU-E1): al llegar recién creada la fábrica, ofrecer cargar su
  // primer encargado abriendo el modal automáticamente. Se limpia el state para
  // no reabrirlo al refrescar o volver.
  useEffect(() => {
    if ((location.state as { addContact?: boolean } | null)?.addContact) {
      setContactModal({ customer: undefined })
      window.history.replaceState({}, '')
    }
  }, [location.state])

  if (factoriesQuery.isLoading) return <p>Cargando fábrica…</p>

  const factory = factoriesQuery.data?.find((f) => f.id === id)

  if (factoriesQuery.isError || !factory) {
    return (
      <div className="content__heading">
        <div>
          <h1 className="content__title">Fábrica no encontrada</h1>
          <p className="content__subtitle">
            La fábrica que buscás no existe o no se pudo cargar.
          </p>
        </div>
        <Link to="/catalogs/factories">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </div>
    )
  }

  const industryName =
    industries.find((i) => i.id === factory.industryId)?.name ?? '—'
  const factoryContacts = (customersQuery.data ?? []).filter(
    (c) => c.factoryId === factory.id,
  )
  // Escenario 3 mira si la fábrica tiene encargados registrados (activos o no);
  // el filtro solo cambia cuáles se listan.
  const hasContacts = factoryContacts.length > 0
  const contacts = showInactive
    ? factoryContacts
    : factoryContacts.filter((c) => c.isActive)
  const fullName = (c: Customer) => `${c.firstName} ${c.lastName}`

  const handleUpdate = (input: FactoryInput) => {
    update.mutate(input, {
      onSuccess: () => {
        showToast('success', 'Fábrica actualizada.')
        setEditing(false)
      },
      onError: (error) =>
        showToast(
          'error',
          isApiError(error) ? error.message : 'No se pudo actualizar la fábrica.',
        ),
    })
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
          setToDeactivate(null)
        },
      },
    )
  }

  const contactColumns: Column<Customer>[] = [
    {
      header: 'Nombre',
      render: (c) => (
        <span className="table__name-cell">
          {fullName(c)}
          {!c.isActive && <Badge variant="pendiente">Inactivo</Badge>}
        </span>
      ),
    },
    {
      header: 'Teléfono',
      render: (c) => (
        <span className="table__name-cell">
          {c.phone || '—'}
          {c.hasWhatsapp && <Badge variant="si">WhatsApp</Badge>}
        </span>
      ),
    },
    { header: 'Email', render: (c) => c.mail || '—' },
    {
      header: 'Acciones',
      align: 'center',
      render: (c) =>
        c.isActive ? (
          <>
            <button
              type="button"
              className="table__action"
              onClick={() => setContactModal({ customer: c })}
            >
              Editar
            </button>
            <span className="table__action-sep">·</span>
            <button
              type="button"
              className="table__action table__td--danger"
              onClick={() => setToDeactivate(c)}
            >
              Eliminar
            </button>
          </>
        ) : (
          '—'
        ),
    },
  ]

  return (
    <>
      <div className="content__heading">
        <div>
          <div className="detail-header__title-row">
            <h1 className="content__title">{factory.name}</h1>
          </div>
          <p className="content__subtitle">
            {editing ? 'Modificá los datos de la fábrica.' : 'Datos de la fábrica.'}
          </p>
        </div>
        <div className="detail-header__actions">
          <Link to="/catalogs/factories">
            <Button variant="outline">← Volver</Button>
          </Link>
          {!editing && <Button onClick={() => setEditing(true)}>Editar</Button>}
        </div>
      </div>

      {editing ? (
        <FactoryForm
          defaultValues={toFactoryFormValues(factory)}
          onSubmit={handleUpdate}
          onCancel={() => setEditing(false)}
          submitting={update.isPending}
          submitLabel="Guardar cambios"
        />
      ) : (
        <FactoryDetails factory={factory} industryName={industryName} />
      )}

      {/* Encargados that belong to this factory. */}
      <div className="content__heading">
        <div>
          <h2 className="info-card__title">Encargados</h2>
          <p className="content__subtitle">
            Personas de contacto de esta fábrica.
          </p>
        </div>
        <div className="detail-header__actions">
          {hasContacts && (
            <label className="filters__checkbox">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(event) => setShowInactive(event.target.checked)}
              />
              Incluir eliminados
            </label>
          )}
          <Button onClick={() => setContactModal({ customer: undefined })}>
            + Agregar encargado
          </Button>
        </div>
      </div>

      <Table
        columns={contactColumns}
        data={contacts}
        rowKey={(c) => `${c.factoryId}-${c.id}`}
        emptyMessage={
          hasContacts
            ? 'No hay encargados que coincidan con el filtro.'
            : 'Esta fábrica no tiene encargados registrados; no será posible enviar informes de cotización.'
        }
      />

      <CustomerFormModal
        open={contactModal !== null}
        onClose={() => setContactModal(null)}
        factoryId={factory.id}
        customer={contactModal?.customer}
      />

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
          <strong>{toDeactivate ? fullName(toDeactivate) : ''}</strong>? Se
          conserva su historial.
        </p>
      </Modal>
    </>
  )
}

/** Read-only presentation of a factory. */
function FactoryDetails({
  factory,
  industryName,
}: {
  factory: Factory
  industryName: string
}) {
  return (
    <div className="info-card">
      <h2 className="info-card__title">Datos de la fábrica</h2>
      <div className="info-grid">
        <div className="info-grid__item">
          <span className="info-grid__label">Código de fábrica</span>
          <span className="info-grid__value">{factory.code}</span>
        </div>
        <div className="info-grid__item">
          <span className="info-grid__label">Rubro</span>
          <span className="info-grid__value">{industryName}</span>
        </div>
        <div className="info-grid__item">
          <span className="info-grid__label">CUIT</span>
          <span className="info-grid__value">{formatCuit(factory.cuit)}</span>
        </div>
        <div className="info-grid__item info-grid__item--full">
          <span className="info-grid__label">Dirección</span>
          <span className="info-grid__value">{factory.address}</span>
        </div>
        <div className="info-grid__item info-grid__item--full">
          <span className="info-grid__label">Formas de pago</span>
          <p className="info-grid__text">{factory.payMethod}</p>
        </div>
      </div>
    </div>
  )
}
