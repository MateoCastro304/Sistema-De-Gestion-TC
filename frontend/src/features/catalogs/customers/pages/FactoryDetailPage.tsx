import { useEffect, useState } from 'react'
import { useParams, useLocation, useNavigate, Link } from 'react-router'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import { formatPhone } from '@/shared/lib/formatPhone'
import fotoTaller from '@/assets/foto-prensa.webp'
import {
  Avatar,
  Badge,
  Button,
  EntityIcon,
  IconTrash,
  Modal,
  Table,
  TrashButton,
  ValueOrDash,
} from '@/shared/components/ui'
import { toneByStatus } from '@/shared/lib/rowTone'
import { cn } from '@/shared/lib/cn'
import type { Column } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { useToast } from '@/app/providers/ToastContext'
import { useCrumbTitle } from '@/app/providers/BreadcrumbContext'
import type { Customer } from '../types/customer'
import type { Factory, FactoryInput } from '../types/factory'
import { formatCuit, toFactoryFormValues } from '../schemas/factory.schema'
import {
  useAllCustomers,
  useDeactivateCustomer,
  useDeactivateFactory,
  useFactories,
  useCategories,
  useUpdateFactory,
} from '../api/customers.queries'
import { FactoryForm } from '../components/FactoryForm'
import { CustomerFormModal } from '../components/CustomerFormModal'
import { customerErrorMessage, customerFullName, factoryErrorMessage } from '../utils/errorMessages'

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
  const { data: categories = [] } = useCategories()
  // Encargados activos de esta fábrica (GET /customers?factoryId=...).
  const customersQuery = useAllCustomers({ factoryId: id, active: true })
  const update = useUpdateFactory(id)
  const deactivate = useDeactivateCustomer()
  const navigate = useNavigate()
  const deactivateFactory = useDeactivateFactory()
  const [confirmFactoryOpen, setConfirmFactoryOpen] = useState(false)

  const [editing, setEditing] = useState(false)
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

  // Nombre de la fábrica en la miga de pan de la topbar.
  useCrumbTitle(factoriesQuery.data?.find((f) => f.id === id)?.name)

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
      <EmptyState
        card
        kind={factoriesQuery.isError ? 'error' : 'no-results'}
        title={
          factoriesQuery.isError
            ? 'No se pudo cargar la fábrica.'
            : 'No encontramos la fábrica que buscabas.'
        }
        action={
          <Link className="btn btn--secondary" to="/catalogos/fabricas">
            Volver al listado
          </Link>
        }
      >
        {factoriesQuery.isError
          ? 'Revisá la conexión e intentá de nuevo.'
          : 'Puede que la hayan eliminado.'}
      </EmptyState>
    )
  }

  const categoryName =
    categories.find((c) => c.id === factory.categoryId)?.name ?? '—'
  // El backend ya acotó a esta fábrica vía `factoryId` y solo trae activos.
  const contacts = customersQuery.data ?? []
  const fullName = (c: Customer) => customerFullName(c)

  const handleUpdate = (input: FactoryInput) => {
    update.mutate(input, {
      onSuccess: () => {
        showToast('success', 'Fábrica actualizada.')
        setEditing(false)
      },
      onError: (error) =>
        showToast(
          'error',
          factoryErrorMessage(error, 'No se pudo actualizar la fábrica.'),
        ),
    })
  }

  const confirmDeactivateFactory = () => {
    deactivateFactory.mutate(id, {
      onSuccess: () => {
        showToast('info', `Fábrica "${factory.name}" eliminada.`)
        void navigate('/catalogos/fabricas')
      },
      onError: (error) => {
        showToast(
          'error',
          factoryErrorMessage(error, 'No se pudo eliminar la fábrica.'),
        )
        setConfirmFactoryOpen(false)
      },
    })
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
            customerErrorMessage(error, 'No se pudo eliminar el encargado.'),
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
          <Avatar name={fullName(c)} icon="encargado" tone={toneByStatus(c.isActive)} shape="round" />
          <b>{fullName(c)}</b>
        </span>
      ),
    },
    {
      header: 'Teléfono',
      render: (c) => <ValueOrDash value={formatPhone(c.phone)} className="table__cell--mono" />,
    },
    {
      header: 'Email',
      render: (c) => (
        <span className="table__cell--email" title={c.mail || undefined}>
          <ValueOrDash value={c.mail} />
        </span>
      ),
    },
    {
      header: '',
      align: 'center',
      cellClassName: 'table__cell--acciones',
      // Editar con texto, como "Ver" en los listados, y eliminar como
      // ícono: borrar no puede pesar lo mismo que la acción principal.
      render: (c) => (
        <>
          <button
            type="button"
            className="link-btn"
            onClick={() => setContactModal({ customer: c })}
            aria-label={`Editar a ${fullName(c)}`}
          >
            Editar
          </button>
          <TrashButton
            label={`Eliminar a ${fullName(c)}`}
            onClick={() => setToDeactivate(c)}
          />
        </>
      ),
    },
  ]

  return (
    <>
      {/* Encabezado del detalle como en el prototipo: el CUIT y la
          etiqueta del rubro debajo del nombre. */}
      <div className="page-header page-header--foto" style={heroPhoto(fotoTaller)}>
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link to="/catalogos/fabricas" className="back-link">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Fábricas
            </Link>

            <Avatar name={factory.name} icon="fabrica" tone={toneByStatus(factory.isActive)} size="lg" />

            <div>
              <div className="detail-header__title-row">
                <h1 className="page-header__title">{factory.name}</h1>
              </div>
              <p className="page-header__subtitle detail-header__meta">
                {factory.cuit ? `CUIT ${formatCuit(factory.cuit)}` : 'Sin CUIT'}
                <Badge variant="suave" icon="rubro">{categoryName}</Badge>
              </p>
            </div>
          </div>
          {/* --editing: en celular estos botones se esconden y los toman
              los del pie del formulario (ver form-actions--mobile). */}
          <div className={editing ? 'detail-header__actions detail-header__actions--editing' : 'detail-header__actions'}>
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
                <Button key="save" type="submit" form={EDIT_FORM_ID} disabled={update.isPending}>
                  {update.isPending ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={() => setConfirmFactoryOpen(true)}>
                  Eliminar
                </Button>
                {/* key: sin ella React reusa este mismo <button> para "Guardar
                    cambios" (type="submit") en medio del click, y el navegador
                    envía el formulario apenas se entra a editar. */}
                <Button key="edit" onClick={() => setEditing(true)}>Editar</Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="detail-main">
        {editing ? (
          <>
            <FactoryForm
              title="Datos de la fábrica"
              lockCuit
              defaultValues={toFactoryFormValues(factory)}
              onSubmit={handleUpdate}
              submitting={update.isPending}
              // Los botones van arriba, en el panel (ver detail-header__actions).
              formId={EDIT_FORM_ID}
              hideActions
            />
            {/* Sólo en celular: los mismos botones, al pie del formulario. */}
            <div className="form-actions form-actions--mobile">
              <Button variant="outline" onClick={() => setEditing(false)} disabled={update.isPending}>
                Cancelar
              </Button>
              <Button type="submit" form={EDIT_FORM_ID} disabled={update.isPending}>
                {update.isPending ? 'Guardando…' : 'Guardar cambios'}
              </Button>
            </div>
          </>
        ) : (
          <FactoryDetails factory={factory} categoryName={categoryName} />
        )}

        {/* Encargados de esta fábrica: una sola tarjeta con el título, la
            acción y la lista adentro, como en el prototipo. */}
        <section className="card card--table">
          <div className="card__head">
            <div className="card__head-text">
              <h2 className="card__title">Encargados</h2>
              <p className="card__subtitle">Personas de contacto de esta fábrica.</p>
            </div>
            <div className="detail-header__actions">
              <Button onClick={() => setContactModal({ customer: undefined })}>
                + Agregar encargado
              </Button>
            </div>
          </div>

          <Table
            variant="cards"
            gridTemplate="minmax(0,1.3fr) 250px minmax(0,1.3fr) 170px"
            rowClassName={(c) => `table__row--${toneByStatus(c.isActive)}`}
            columns={contactColumns}
            data={contacts}
            rowKey={(c) => `${c.factoryId}-${c.id}`}
            emptyState={
              <div className="card__empty">
                <span className="state__icon" aria-hidden="true">
                  <EntityIcon name="encargado" />
                </span>
                <p className="card__empty-text">
                  Esta fábrica no tiene encargados registrados; no será posible
                  enviar informes de cotización.
                </p>
              </div>
            }
          />
        </section>
      </div>

      <Modal
        open={confirmFactoryOpen}
        onClose={() => setConfirmFactoryOpen(false)}
        title="Eliminar fábrica"
        tone="danger"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setConfirmFactoryOpen(false)}
              disabled={deactivateFactory.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={confirmDeactivateFactory}
              disabled={deactivateFactory.isPending}
            >
              <IconTrash />
              {deactivateFactory.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p>
          ¿Seguro que querés eliminar la fábrica <strong>{factory.name}</strong>?
          Sólo se puede si no tiene encargados activos. Se conserva su historial.
        </p>
      </Modal>

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

/** Datos de la fábrica en lectura: tres columnas, como en el prototipo. */
function FactoryDetails({
  factory,
  categoryName,
}: {
  factory: Factory
  categoryName: string
}) {
  return (
    <section className="card">
      <h2 className="card__title">Datos de la fábrica</h2>
      <div className="card__grid card__grid--3">
        <div className="field">
          <span className="field__label">Rubro</span>
          <span className="field__value">{categoryName}</span>
        </div>
        <div className="field">
          <span className="field__label">CUIT</span>
          <span className={cn('field__value', !factory.cuit && 'field__value--muted')}>
            {factory.cuit ? formatCuit(factory.cuit) : '—'}
          </span>
        </div>
        <div className="field card__full">
          <span className="field__label">Dirección</span>
          <span className={cn('field__value', !factory.address && 'field__value--muted')}>
            {factory.address || '—'}
          </span>
        </div>
        <div className="field card__full">
          <span className="field__label">Formas de pago</span>
          <p className={cn('field__value field__value--text', !factory.payMethod && 'field__value--muted')}>
            {factory.payMethod || 'Sin datos.'}
          </p>
        </div>
      </div>
    </section>
  )
}
