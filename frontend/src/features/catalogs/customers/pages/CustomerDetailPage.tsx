import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoTaller from '@/assets/foto-fresado.webp'
import { Avatar, Badge, Button, IconTrash, Modal, TrashButton } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { toneByStatus } from '@/shared/lib/rowTone'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Customer, CustomerInput } from '../types/customer'
import type { Factory } from '../types/factory'
import {
  useActivateCustomer,
  useCustomer,
  useDeactivateCustomer,
  useFactories,
  useCategories,
  useUpdateCustomer,
} from '../api/customers.queries'
import { toCustomerFormValues } from '../schemas/customer.schema'
import { formatCuit } from '../schemas/factory.schema'
import { CustomerForm } from '../components/CustomerForm'
import { customerErrorMessage, customerFullName } from '../utils/errorMessages'

/** id del formulario de edición: lo usa el botón Guardar del panel. */
const EDIT_FORM_ID = 'customer-edit-form'

/**
 * CU-03 Consultar Cliente (read-only) with an "Editar" toggle for CU-02
 * Modificar Cliente, plus the eliminar action (baja lógica, CU-04).
 */
export function CustomerDetailPage() {
  const { factoryId = '', id = '' } = useParams<{
    factoryId: string
    id: string
  }>()
  const navigate = useNavigate()
  const showToast = useToast()

  const customerQuery = useCustomer(factoryId, id)
  const { data: factories = [] } = useFactories()
  const { data: categories = [] } = useCategories()
  const update = useUpdateCustomer(factoryId, id)
  const deactivate = useDeactivateCustomer()
  const activate = useActivateCustomer()

  // The detail view starts read-only; "Editar" switches to the form.
  const [editing, setEditing] = useState(false)
  // Eliminar pide confirmación, igual que desde el listado.
  const [confirmOpen, setConfirmOpen] = useState(false)

  if (customerQuery.isLoading) {
    return (
      <div className="empty-state">
        <p className="empty-state__text">Cargando encargado…</p>
      </div>
    )
  }

  if (customerQuery.isError || !customerQuery.data) {
    const notFound =
      isApiError(customerQuery.error) && customerQuery.error.isNotFound
    return (
      <EmptyState
        card
        kind={notFound ? 'no-results' : 'error'}
        title={
          notFound
            ? 'No encontramos el encargado que buscabas.'
            : 'No se pudo cargar el encargado.'
        }
        action={
          <Link className="btn btn--secondary" to="/catalogos/encargados">
            Volver al listado
          </Link>
        }
      >
        {notFound ? 'Puede que lo hayan eliminado.' : 'Revisá la conexión e intentá de nuevo.'}
      </EmptyState>
    )
  }

  const customer = customerQuery.data
  const fullName = customerFullName(customer)
  const factory = factories.find((f) => f.id === customer.factoryId)
  const categoryName =
    categories.find((c) => c.id === factory?.categoryId)?.name ?? '—'

  const handleSubmit = (input: CustomerInput) => {
    update.mutate(input, {
      onSuccess: () => {
        showToast('success', 'Encargado actualizado.')
        setEditing(false)
      },
      onError: (error) =>
        showToast(
          'error',
          customerErrorMessage(error, 'No se pudo actualizar.'),
        ),
    })
  }

  const handleDeactivate = () => {
    deactivate.mutate(
      { factoryId: customer.factoryId, id: customer.id },
      {
        onSuccess: () => {
          // 'info' y no 'success': un borrado no es un logro.
          showToast('info', `Encargado "${fullName}" eliminado.`)
          navigate('/catalogos/encargados')
        },
        onError: (error) => {
          setConfirmOpen(false)
          showToast(
            'error',
            customerErrorMessage(error, 'No se pudo eliminar el encargado.'),
          )
        },
      },
    )
  }

  const handleActivate = () => {
    activate.mutate(
      { factoryId: customer.factoryId, id: customer.id },
      {
        onSuccess: () =>
          showToast('success', `Encargado "${fullName}" reactivado.`),
        onError: (error) =>
          showToast(
            'error',
            customerErrorMessage(error, 'No se pudo reactivar el encargado.'),
          ),
      },
    )
  }

  return (
    <>
      {/* Rediseño: el encabezado es el panel azul de los otros catálogos.
          El "← Volver" pasa a ser el botón redondo de la izquierda, que es
          donde el resto de las pantallas lo tiene. Misma ruta, mismo link. */}
      <div className="page-header page-header--foto" style={heroPhoto(fotoTaller)}>
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link to="/catalogos/encargados" className="back-link">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Encargados
            </Link>

            {/* El cuadrado con las iniciales, en su tamaño grande: el mismo
                que se ve en el listado, para reconocer que es el mismo. */}
            <Avatar name={fullName} icon="encargado" tone={toneByStatus(customer.isActive)} size="lg" />

            <div>
              <div className="detail-header__title-row">
                <h1 className="page-header__title">{fullName}</h1>
                {/* Mismo aviso que en el listado: sin la etiqueta, un
                    eliminado sólo se distinguía por el botón Reactivar. */}
                {!customer.isActive && <Badge variant="neutral">Inactivo</Badge>}
              </div>
              <p className="page-header__subtitle">
                {editing
                  ? 'Modificá los datos del encargado.'
                  : 'Datos del encargado.'}
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
                <Button type="submit" form={EDIT_FORM_ID} disabled={update.isPending}>
                  {update.isPending ? 'Guardando…' : 'Guardar cambios'}
                </Button>
              </>
            ) : (
              <>
                <Button onClick={() => setEditing(true)}>Editar</Button>
                {customer.isActive ? (
                  /* El botón de eliminar con el tacho animado. Adentro del
                     panel oscuro va en vidrio y se pone blanco con texto rojo
                     al pasar el mouse. */
                  <TrashButton
                    label={`Eliminar a ${fullName}`}
                    onClick={() => setConfirmOpen(true)}
                  >
                    Eliminar
                  </TrashButton>
                ) : (
                  <Button variant="outline" onClick={handleActivate} disabled={activate.isPending}>
                    {activate.isPending ? 'Reactivando…' : 'Reactivar'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {editing ? (
        <>
          <CustomerForm
            // La fábrica de un encargado es inmutable (RNF-3): se muestra como
            // dato de solo lectura y no se puede reasignar al editar.
            lockedFactoryId={customer.factoryId}
            defaultValues={toCustomerFormValues(customer)}
            onSubmit={handleSubmit}
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
        <CustomerDetails
          customer={customer}
          factory={factory}
          categoryName={categoryName}
        />
      )}

      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Eliminar encargado"
        tone="danger"
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={deactivate.isPending}
            >
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleDeactivate} disabled={deactivate.isPending}>
              <IconTrash />
              {deactivate.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
          </>
        }
      >
        <p>
          ¿Seguro que querés eliminar a <strong>{fullName}</strong>? El
          encargado se eliminará, pero se conserva su historial.
        </p>
      </Modal>
    </>
  )
}

/** Read-only presentation of a contact and its factory. */
function CustomerDetails({
  customer,
  factory,
  categoryName,
}: {
  customer: Customer
  factory?: Factory
  categoryName: string
}) {
  return (
    <>
      <div className="card">
        <h2 className="card__title">Datos del encargado</h2>
        <div className="card__grid">
          <div className="field">
            <span className="field__label">Teléfono</span>
            <span className="field__value">{customer.phone || '—'}</span>
          </div>
          <div className="field">
            <span className="field__label">Email</span>
            <span className="field__value">{customer.mail || '—'}</span>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="card__title">Fábrica</h2>
        {factory ? (
          <div className="card__grid">
            <div className="field">
              <span className="field__label">Nombre</span>
              <span className="field__value">{factory.name}</span>
            </div>
            <div className="field">
              <span className="field__label">Rubro</span>
              <span className="field__value">{categoryName}</span>
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
        ) : (
          <p className="field__value">Sin fábrica asociada.</p>
        )}
      </div>
    </>
  )
}
