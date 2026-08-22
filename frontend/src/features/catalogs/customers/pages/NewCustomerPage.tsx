import { useNavigate, Link } from 'react-router'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { CustomerInput } from '../types/customer'
import { useCreateCustomer } from '../api/customers.queries'
import { CustomerForm } from '../components/CustomerForm'

/** CU-01 Registrar Cliente. */
export function NewCustomerPage() {
  const navigate = useNavigate()
  const showToast = useToast()
  const create = useCreateCustomer()

  const handleSubmit = (input: CustomerInput) => {
    create.mutate(input, {
      onSuccess: (customer) => {
        showToast('success', `Cliente "${customer.name}" registrado.`)
        navigate('/catalogs/customers')
      },
      onError: (error) => {
        showToast(
          'error',
          isApiError(error) ? error.message : 'No se pudo registrar el cliente.',
        )
      },
    })
  }

  return (
    <>
      <div className="content__heading">
        <div>
          <h1 className="content__title">Nuevo cliente</h1>
          <p className="content__subtitle">
            Registrá los datos del cliente y su descripción de pago.
          </p>
        </div>
        <Link to="/catalogs/customers">
          <span className="table__action">← Volver</span>
        </Link>
      </div>

      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/catalogs/customers')}
        submitting={create.isPending}
        submitLabel="Registrar cliente"
      />
    </>
  )
}
