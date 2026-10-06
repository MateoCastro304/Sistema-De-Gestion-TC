import { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router'
import {
  Avatar,
  Badge,
  Button,
  CheckBox,
  IconTrash,
  Modal,
  Table,
  TrashButton,
} from '@/shared/components/ui'
import { toneByStatus } from '@/shared/lib/rowTone'
import type { Column } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Customer } from '../types/customer'
import type { Factory, FactoryInput } from '../types/factory'
import { formatCuit, toFactoryFormValues } from '../schemas/factory.schema'
import {
  useActivateCustomer,
  useCustomers,
  useDeactivateCustomer,
  useFactories,
  useIndustries,
  useUpdateFactory,
} from '../api/customers.queries'
import { FactoryForm } from '../components/FactoryForm'
import { CustomerFormModal } from '../components/CustomerFormModal'

/** id del formulario de edición: lo usa el botón Guardar del panel. */
const EDIT_FORM_ID = 'factory-edit-form'

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
  // Encargados de esta fábrica (GET /customers?factoryId=...). Traemos activos e
  // inactivos; el filtro de abajo decide cuáles se listan.
  const customersQuery = useCustomers({ factoryId: id, limit: 200 })
  const update = useUpdateFactory(id)
  const deactivate = useDeactivateCustomer()
  const activate = useActivateCustomer()

  const [editing, setEditing] = useState(false)
  // Regla de negocio: los encargados inactivos se muestran solo con este filtro.
  const [showInactive, setShowInactive] = useState(false)
  // Encargado modal: null closed; { customer } edits; { customer: undefined } adds.
  // Escenario 1 (HU-E1): al llegar recién creada la fábrica se ofrece cargar su
  // primer encargado, así que el modal arranca abierto. Se resuelve en el
  // valor inicial y no en un efecto: un setState dentro de un efecto dispara
  // un render en cascada.
  const [contactModal, setContactModal] = useState<{
    customer?: Customer
  } | null>(() =>
    (location.state as { addContact?: boolean } | null)?.addContact
      ? { customer: undefined }
      : null,
  )
  // Encargado pending confirmation for baja lógica.
  const [toDeactivate, setToDeactivate] = useState<Customer | null>(null)

  // Se limpia el state de la navegación para que el modal no se reabra al
  // refrescar o al volver.
  useEffect(() => {
    if ((location.state as { addContact?: boolean } | null)?.addContact) {
      window.history.replaceState({}, '')
    }
  }, [location.state])

  if (factoriesQuery.isLoading) {
    return (
      <div className="empty-state">
        <p className="empty-state__text">Cargando fábrica…</p>
      </div>
    )
  }

  const factory = factoriesQuery.data?.find((f) => f.id === id)

  if (factoriesQuery.isError || !factory) {
    return (
      <div className="empty-state">
        <p className="empty-state__text">
          {factoriesQuery.isError
            ? 'No se pudo cargar la fábrica.'
            : 'No encontramos la fábrica que buscabas.'}{' '}
          <Link className="table__action" to="/catalogos/fabricas">
            Volver al listado
          </Link>
        </p>
      </div>
    )
  }

  const industryName =
    industries.find((i) => i.id === factory.categoryId)?.name ?? '—'
  // El backend ya acotó a esta fábrica vía `factoryId`.
  const factoryContacts = customersQuery.data?.items ?? []
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
          // 'info' y no 'success': un borrado no es un logro, y el verde
          // se reserva para lo que se creó o se guardó.
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
          setToDeactivate(null)
        },
      },
    )
  }

  const contactColumns: Column<Customer>[] = [
    {
      header: 'Nombre',
      render: (c) => (
        <span className="table__cell--nombre">
          <Avatar name={fullName(c)} tone={toneByStatus(c.isActive)} />
          <b>{fullName(c)}</b>
          {!c.isActive && <Badge variant="neutral">Inactivo</Badge>}
        </span>
      ),
    },
    {
      header: 'Teléfono',
      render: (c) => <span className="table__cell--mono">{c.phone || '—'}</span>,
    },
    { header: 'Email', render: (c) => c.mail || '—' },
    {
      header: '',
      align: 'center',
      cellClassName: 'table__cell--acciones',
      // Editar y eliminar como íconos: son dos acciones por fila y con
      // texto compiten con el nombre, que es lo que se viene a leer.
      render: (c) =>
        c.isActive ? (
          <>
            <button
              type="button"
              className="row-action row-action--edit"
              onClick={() => setContactModal({ customer: c })}
              aria-label={`Editar a ${fullName(c)}`}
              title="Editar"
            >
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                <path d="M13.5 3.5 16.5 6.5 7 16H4v-3z" strokeLinejoin="round" />
              </svg>
            </button>
            <TrashButton
              label={`Eliminar a ${fullName(c)}`}
              onClick={() => setToDeactivate(c)}
            />
          </>
        ) : (
          // Un eliminado no se edita ni se vuelve a eliminar: sólo se
          // reactiva, igual que en el listado general de Encargados.
          <button
            type="button"
            className="table__action"
            onClick={() => handleActivate(c)}
            disabled={activate.isPending}
          >
            Reactivar
          </button>
        ),
    },
  ]

  return (
    <>
      {/* Rediseño: el encabezado es el panel azul de los otros catálogos.
          El "← Volver" pasa a ser el botón redondo de la izquierda, que es
          donde el resto de las pantallas lo tiene. Misma ruta, mismo link. */}
      <div className="page-header">
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link
              to="/catalogos/fabricas"
              className="btn btn--icon"
              aria-label="Volver al listado de fábricas"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            <Avatar name={factory.name} tone={toneByStatus(factory.isActive)} size="lg" />

            <div>
              <div className="detail-header__title-row">
                <h1 className="page-header__title">{factory.name}</h1>
              </div>
              <p className="page-header__subtitle detail-header__meta">
                {`CUIT: ${formatCuit(factory.cuit)}`}
                <Badge variant="suave">{industryName}</Badge>
              </p>
            </div>
          </div>
          <div className="detail-header__actions">
            {/* Editando, Cancelar y Guardar ocupan el lugar de Editar, como
                en el detalle de Proveedores. Guardar está fuera del <form>:
                lo envía por el atributo `form`, así la validación de
                react-hook-form corre igual que con el botón de adentro. */}
            {editing ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={update.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" form={EDIT_FORM_ID} disabled={update.isPending}>
                  {update.isPending ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>Editar</Button>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <FactoryForm
          defaultValues={toFactoryFormValues(factory)}
          onSubmit={handleUpdate}
          submitting={update.isPending}
          // Los botones van arriba, en el panel (ver detail-header__actions).
          formId={EDIT_FORM_ID}
          hideActions
        />
      ) : (
        <FactoryDetails factory={factory} industryName={industryName} />
      )}

      {/* Encargados that belong to this factory. */}
      <div className="content__heading">
        <div>
          <h2 className="card__title">Encargados</h2>
          <p className="content__subtitle">
            Personas de contacto de esta fábrica.
          </p>
        </div>
        <div className="detail-header__actions">
          {hasContacts && (
            /* Este filtro vive sobre fondo claro, no dentro del panel
               azul, así que usa el cuadro en su versión normal. */
            <label className="filters__checkbox">
              <CheckBox
                checked={showInactive}
                onChange={() => setShowInactive(!showInactive)}
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
        /* Mismas filas-tarjeta que los listados, para que la sección de
           encargados de acá adentro no se lea como otra cosa. */
        variant="cards"
        gridTemplate="minmax(0,2fr) minmax(0,1.4fr) minmax(0,1.6fr) 112px"
        rowClassName={(c) => `table__row--${toneByStatus(c.isActive)}`}
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
            {/* danger y no primario: era el único "Eliminar" azul de la
                app. El tacho abre la tapa al pasar el mouse. */}
            <Button variant="danger" onClick={confirmDeactivate} disabled={deactivate.isPending}>
              <IconTrash />
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
    <div className="card">
      <h2 className="card__title">Datos de la fábrica</h2>
      <div className="card__grid">
        <div className="field">
          <span className="field__label">Rubro</span>
          <span className="field__value">{industryName}</span>
        </div>
        <div className="field">
          <span className="field__label">CUIT</span>
          <span className="field__value">{formatCuit(factory.cuit)}</span>
        </div>
        <div className="field card__full">
          <span className="field__label">Dirección</span>
          <span className="field__value">{factory.address || '—'}</span>
        </div>
        <div className="field card__full">
          <span className="field__label">Formas de pago</span>
          <p className="field__value">{factory.payMethod || '—'}</p>
        </div>
      </div>
    </div>
  )
}
