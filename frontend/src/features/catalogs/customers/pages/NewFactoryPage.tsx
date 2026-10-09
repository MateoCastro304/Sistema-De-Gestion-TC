import { useNavigate, Link } from 'react-router'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoTaller from '@/assets/foto-dispositivo.webp'
import { useToast } from '@/app/providers/ToastContext'
import type { FactoryInput } from '../types/factory'
import { useCreateFactory } from '../api/customers.queries'
import { FactoryForm } from '../components/FactoryForm'
import { factoryErrorMessage } from '../utils/errorMessages'

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
          factoryErrorMessage(error, 'No se pudo registrar la fábrica.'),
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
            <Link to="/catalogos/fabricas" className="back-link">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Fábricas
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
