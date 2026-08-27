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
        showToast('success', `Fábrica "${factory.name}" registrada.`)
        navigate(`/catalogs/factories/${factory.id}`)
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
      <div className="content__heading">
        <div>
          <h1 className="content__title">Nueva fábrica</h1>
          <p className="content__subtitle">
            Registrá los datos de la fábrica. Después vas a poder agregarle sus
            encargados.
          </p>
        </div>
        <Link to="/catalogs/factories">
          <span className="table__action">← Volver</span>
        </Link>
      </div>

      <FactoryForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/catalogs/factories')}
        submitting={create.isPending}
        submitLabel="Registrar fábrica"
      />
    </>
  )
}
