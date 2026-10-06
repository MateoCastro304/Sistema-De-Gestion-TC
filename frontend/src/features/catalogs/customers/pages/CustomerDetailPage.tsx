import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { Avatar, Badge, Button, TrashButton } from '@/shared/components/ui'
import { toneByStatus } from '@/shared/lib/rowTone'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { Customer, CustomerInput } from '../types/customer'
import type { Factory } from '../types/factory'
import {
  useCustomer,
  useDeactivateCustomer,
  useFactories,
  useIndustries,
  useUpdateCustomer,
} from '../api/customers.queries'
import { toCustomerFormValues } from '../schemas/customer.schema'
import { formatCuit } from '../schemas/factory.schema'
import { CustomerForm } from '../components/CustomerForm'

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
  const { data: industries = [] } = useIndustries()
  const update = useUpdateCustomer(factoryId, id)
  const deactivate = useDeactivateCustomer()

  // The detail view starts read-only; "Editar" switches to the form.
  const [editing, setEditing] = useState(false)

  if (customerQuery.isLoading) return <p>Cargando encargado…</p>

  if (customerQuery.isError || !customerQuery.data) {
    const notFound =
      isApiError(customerQuery.error) && customerQuery.error.isNotFound
    return (
      <div className="content__heading">
        <div>
          <h1 className="content__title">Encargado no encontrado</h1>
          <p className="content__subtitle">
            {notFound
              ? 'El encargado que buscás no existe o fue eliminado.'
              : 'No se pudo cargar el encargado.'}
          </p>
        </div>
        <Link to="/catalogs/customers">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </div>
    )
  }

  const customer = customerQuery.data
  const fullName = `${customer.firstName} ${customer.lastName}`
  const factory = factories.find((f) => f.id === customer.factoryId)
  const industryName =
    industries.find((i) => i.id === factory?.industryId)?.name ?? '—'

  const handleSubmit = (input: CustomerInput) => {
    update.mutate(input, {
      onSuccess: () => {
        showToast('success', 'Encargado actualizado.')
        setEditing(false)
      },
      onError: (error) =>
        showToast(
          'error',
          isApiError(error) ? error.message : 'No se pudo actualizar.',
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
          navigate('/catalogs/customers')
        },
        onError: (error) =>
          showToast(
            'error',
            isApiError(error)
              ? error.message
              : 'No se pudo eliminar el encargado.',
          ),
      },
    )
  }

  return (
    <>
      {/* Rediseño: el encabezado es el panel azul de los otros catálogos.
          El "← Volver" pasa a ser el botón redondo de la izquierda, que es
          donde el resto de las pantallas lo tiene. Misma ruta, mismo link. */}
      <div className="page-header">
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link
              to="/catalogs/customers"
              className="btn btn--icon"
              aria-label="Volver al listado de encargados"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>

            {/* El cuadrado con las iniciales, en su tamaño grande: el mismo
                que se ve en el listado, para reconocer que es el mismo. */}
            <Avatar name={fullName} tone={toneByStatus(customer.isActive)} size="lg" />

            <div>
              <div className="detail-header__title-row">
                <h1 className="page-header__title">{fullName}</h1>
              </div>
              <p className="page-header__subtitle">
                {editing
                  ? 'Modificá los datos del encargado.'
                  : 'Datos del encargado.'}
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
              <>
                <Button onClick={() => setEditing(true)}>Editar</Button>
                {customer.isActive && (
                  /* El botón de eliminar con el tacho animado. Adentro del
                     panel oscuro va en vidrio y se pone blanco con texto rojo
                     al pasar el mouse. */
                  <TrashButton
                    label={`Eliminar a ${fullName}`}
                    onClick={handleDeactivate}
                    disabled={deactivate.isPending}
                  >
                    {deactivate.isPending ? 'Eliminando…' : 'Eliminar'}
                  </TrashButton>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {editing ? (
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
      ) : (
        <CustomerDetails
          customer={customer}
          factory={factory}
          industryName={industryName}
        />
      )}
    </>
  )
}

/** Read-only presentation of a contact and its factory. */
function CustomerDetails({
  customer,
  factory,
  industryName,
}: {
  customer: Customer
  factory?: Factory
  industryName: string
}) {
  return (
    <>
      <div className="card">
        <h2 className="card__title">Datos del encargado</h2>
        <div className="card__grid">
          <div className="field">
            <span className="field__label">Teléfono</span>
            <span className="field__value">
              {customer.phone || '—'}
              {/* verde, igual que en el listado: la variante pastel "si"
                  quedaba de otro color que la misma etiqueta en la tabla. */}
              {customer.hasWhatsapp && <Badge variant="verde">WhatsApp</Badge>}
            </span>
          </div>
          <div className="field">
            <span className="field__label">Email</span>
            <span className="field__value">{customer.mail || '—'}</span>
          </div>
          {customer.observation && (
            <div className="field card__full">
              <span className="field__label">Observaciones</span>
              <p className="field__value">{customer.observation}</p>
            </div>
          )}
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
              <span className="field__value">{industryName}</span>
            </div>
            <div className="field">
              <span className="field__label">CUIT</span>
              <span className="field__value">{formatCuit(factory.cuit)}</span>
            </div>
            <div className="field card__full">
              <span className="field__label">Dirección</span>
              <span className="field__value">{factory.address}</span>
            </div>
            <div className="field card__full">
              <span className="field__label">Formas de pago</span>
              <p className="field__value">{factory.payMethod}</p>
            </div>
          </div>
        ) : (
          <p className="field__value">Sin fábrica asociada.</p>
        )}
      </div>
    </>
  )
}
