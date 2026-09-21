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
        showToast(
          'success',
          `Encargado "${customer.firstName} ${customer.lastName}" registrado.`,
        )
        navigate('/catalogos/encargados')
      },
      onError: (error) => {
        showToast(
          'error',
          isApiError(error) ? error.message : 'No se pudo registrar el encargado.',
        )
      },
    })
  }

  return (
    <>
      <div className="content__heading">
        <div>
          <h1 className="content__title">Nuevo encargado</h1>
          <p className="content__subtitle">
            Registrá los datos del encargado y la fábrica a la que pertenece.
          </p>
        </div>
        <Link to="/catalogos/encargados">
          <span className="table__action">← Volver</span>
        </Link>
      </div>

      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/catalogos/encargados')}
        submitting={create.isPending}
        submitLabel="Registrar encargado"
      />
    </>
  )
}
