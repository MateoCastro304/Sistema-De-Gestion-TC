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
      {/* Rediseño: mismo panel azul que el listado y el detalle. El
          "← Volver" pasa al botón redondo de la izquierda. */}
      <div className="page-header">
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link
              to="/catalogos/encargados"
              className="btn btn--icon"
              aria-label="Volver al listado de encargados"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div>
              <h1 className="page-header__title">Nuevo encargado</h1>
              <p className="page-header__subtitle">
                Registrá los datos del encargado y la fábrica a la que pertenece.
              </p>
            </div>
          </div>
        </div>
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
