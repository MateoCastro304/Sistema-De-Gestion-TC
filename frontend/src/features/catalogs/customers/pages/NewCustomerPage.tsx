import { useNavigate, Link } from 'react-router'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoTaller from '@/assets/foto-cono.webp'
import { useToast } from '@/app/providers/ToastContext'
import type { CustomerInput } from '../types/customer'
import { useCreateCustomer } from '../api/customers.queries'
import { CustomerForm } from '../components/CustomerForm'
import { customerErrorMessage, customerFullName } from '../utils/errorMessages'

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
          `Encargado "${customerFullName(customer)}" registrado.`,
        )
        void navigate('/catalogos/encargados')
      },
      onError: (error) => {
        showToast(
          'error',
          customerErrorMessage(error, 'No se pudo registrar el encargado.'),
        )
      },
    })
  }

  return (
    <>
      {/* Rediseño: mismo panel azul que el listado y el detalle. El
          "← Volver" pasa al botón redondo de la izquierda. */}
      <div className="page-header page-header--foto" style={heroPhoto(fotoTaller)}>
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link to="/catalogos/encargados" className="back-link">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Encargados
            </Link>
            <div>
              <h1 className="page-header__title">Nuevo encargado</h1>
              <p className="page-header__subtitle">Persona de contacto de una fábrica.</p>
            </div>
          </div>
        </div>
      </div>

      <CustomerForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/catalogos/encargados')}
        submitting={create.isPending}
        submitLabel="Crear encargado"
      />
    </>
  )
}
