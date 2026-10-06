import { useNavigate, Link } from 'react-router'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import type { FactoryInput } from '../types/factory'
import { useCreateFactory } from '../api/customers.queries'
import { FactoryForm } from '../components/FactoryForm'

/** CU-58 Registrar Fábrica. */
export function NewFactoryPage() {
  const navigate = useNavigate()
  const showToast = useToast()
  const create = useCreateFactory()

  const handleSubmit = (input: FactoryInput) => {
    create.mutate(input, {
      onSuccess: (factory) => {
        showToast('success', 'Fábrica registrada correctamente.')
        // Escenario 1: ofrecer continuar con el alta de sus encargados (HU-E1)
        // abriendo el modal de "Agregar encargado" al llegar al detalle.
        navigate(`/catalogos/fabricas/${factory.id}`, {
          state: { addContact: true },
        })
      },
      onError: (error) => {
        showToast(
          'error',
          isApiError(error) ? error.message : 'No se pudo registrar la fábrica.',
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
              to="/catalogos/fabricas"
              className="btn btn--icon"
              aria-label="Volver al listado de fábricas"
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <div>
              <h1 className="page-header__title">Nueva fábrica</h1>
              <p className="page-header__subtitle">
                Registrá los datos de la fábrica. Después vas a poder agregarle
                sus encargados.
              </p>
            </div>
          </div>
        </div>
      </div>

      <FactoryForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/catalogos/fabricas')}
        submitting={create.isPending}
        submitLabel="Registrar fábrica"
      />
    </>
  )
}
