import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router'
import { Badge, Button } from '@/shared/components/ui'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import { PERSON_TYPE_LABEL } from '../types/customer'
import type { Customer, CustomerInput } from '../types/customer'
import {
  useCustomer,
  useDeactivateCustomer,
  useIndustries,
  useUpdateCustomer,
} from '../api/customers.queries'
import { toCustomerFormValues } from '../schemas/customer.schema'
import { CustomerForm } from '../components/CustomerForm'

/**
 * CU-03 Consultar Cliente (read-only) with an "Editar" toggle for CU-02
 * Modificar Cliente, plus the desactivar action (CU-04).
 */
export function CustomerDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const showToast = useToast()

  const customerQuery = useCustomer(id)
  const { data: industries = [] } = useIndustries()
  const update = useUpdateCustomer(id)
  const deactivate = useDeactivateCustomer()

  // The detail view starts read-only; "Editar" switches to the form.
  const [editing, setEditing] = useState(false)

  if (customerQuery.isLoading) return <p>Cargando cliente…</p>

  if (customerQuery.isError || !customerQuery.data) {
    const notFound =
      isApiError(customerQuery.error) && customerQuery.error.isNotFound
    return (
      <div className="content__heading">
        <div>
          <h1 className="content__title">Cliente no encontrado</h1>
          <p className="content__subtitle">
            {notFound
              ? 'El cliente que buscás no existe o fue eliminado.'
              : 'No se pudo cargar el cliente.'}
          </p>
        </div>
        <Link to="/catalogs/customers">
          <Button variant="outline">Volver al listado</Button>
        </Link>
      </div>
    )
  }

  const customer = customerQuery.data
  const industryName =
    industries.find((i) => i.id === customer.industryId)?.name ?? '—'

  const handleSubmit = (input: CustomerInput) => {
    update.mutate(input, {
      onSuccess: () => {
        showToast('success', 'Cliente actualizado.')
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
    deactivate.mutate(customer.id, {
      onSuccess: () => {
        showToast('success', `Cliente "${customer.name}" desactivado.`)
        navigate('/catalogs/customers')
      },
      onError: (error) =>
        showToast(
          'error',
          isApiError(error) ? error.message : 'No se pudo desactivar el cliente.',
        ),
    })
  }

  return (
    <>
      <div className="content__heading">
        <div>
          <div className="detail-header__title-row">
            <h1 className="content__title">{customer.name}</h1>
            {customer.isActive ? (
              <Badge variant="si">Activo</Badge>
            ) : (
              <Badge variant="pendiente">Inactivo</Badge>
            )}
          </div>
          <p className="content__subtitle">
            {editing ? 'Modificá los datos del cliente.' : 'Datos del cliente.'}
          </p>
        </div>
        <div className="detail-header__actions">
          <Link to="/catalogs/customers">
            <Button variant="outline">← Volver</Button>
          </Link>
          {!editing && (
            <>
              <Button onClick={() => setEditing(true)}>Editar</Button>
              {customer.isActive && (
                <Button
                  variant="outline"
                  onClick={handleDeactivate}
                  disabled={deactivate.isPending}
                >
                  {deactivate.isPending ? 'Desactivando…' : 'Desactivar'}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {editing ? (
        <CustomerForm
          defaultValues={toCustomerFormValues(customer)}
          onSubmit={handleSubmit}
          onCancel={() => setEditing(false)}
          submitting={update.isPending}
          submitLabel="Guardar cambios"
        />
      ) : (
        <CustomerDetails customer={customer} industryName={industryName} />
      )}
    </>
  )
}

/** Read-only presentation of a customer's data. */
function CustomerDetails({
  customer,
  industryName,
}: {
  customer: Customer
  industryName: string
}) {
  return (
    <div className="info-card">
      <h2 className="info-card__title">Información del cliente</h2>
      <div className="info-grid">
        <div className="info-grid__item">
          <span className="info-grid__label">Tipo de persona</span>
          <span className="info-grid__value">
            {PERSON_TYPE_LABEL[customer.personType]}
          </span>
        </div>
        <div className="info-grid__item">
          <span className="info-grid__label">Rubro</span>
          <span className="info-grid__value">{industryName}</span>
        </div>
        <div className="info-grid__item">
          <span className="info-grid__label">Teléfono</span>
          <span className="info-grid__value">{customer.phone || '—'}</span>
        </div>
        <div className="info-grid__item info-grid__item--full">
          <span className="info-grid__label">Dirección</span>
          <span className="info-grid__value">{customer.address}</span>
        </div>
        <div className="info-grid__item info-grid__item--full">
          <span className="info-grid__label">Emails</span>
          <span className="info-grid__value">{customer.emails.join(', ')}</span>
        </div>
        <div className="info-grid__item info-grid__item--full">
          <span className="info-grid__label">Descripción de pago</span>
          <p className="info-grid__text">{customer.paymentDescription}</p>
        </div>
      </div>
    </div>
  )
}
