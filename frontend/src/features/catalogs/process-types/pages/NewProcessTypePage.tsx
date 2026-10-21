import { Link, useNavigate } from 'react-router'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoCnc from '@/assets/foto-cnc.webp'
import { useCreateProcessType, useExchangeRate } from '../api/process-types.queries'
import { ProcessTypeForm, type SetFieldError } from '../components/ProcessTypeForm'
import {
  emptyProcessTypeForm,
  toProcessTypeCreate,
  type ProcessTypeFormValues,
} from '../schemas/process-type.schema'
const LIST_PATH = '/catalogos/tipos-de-proceso'

/** CU-09 Registrar tipo de proceso. */
export function NewProcessTypePage() {
  const navigate = useNavigate()
  const showToast = useToast()
  // Acá sale el GET /exchange-rate: apenas se monta la página.
  const exchangeRate = useExchangeRate()
  const create = useCreateProcessType()

  const handleSubmit = (values: ProcessTypeFormValues, setFieldError: SetFieldError) => {
    create.mutate(toProcessTypeCreate(values), {
      onSuccess: (created) => {
        showToast('success', 'Tipo de proceso registrado correctamente')
        void navigate(`${LIST_PATH}/${created.id}`)
      },
      onError: (error) => {
        // El único 409 del alta es el nombre repetido: va en el campo (esc. 2).
        if (isApiError(error) && error.isConflict) {
          setFieldError('name', error.message)
          return
        }
        // Los mensajes del Sprint 2 ya vienen en castellano para el usuario.
        showToast('error', isApiError(error) ? error.message : 'No se pudo registrar el tipo de proceso.')
      },
    })
  }

  return (
    <>
      <div className="page-header page-header--foto" style={heroPhoto(fotoCnc)}>
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link to={LIST_PATH} className="back-link">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Tipos de proceso
            </Link>
            <div>
              <h1 className="page-header__title">Nuevo tipo de proceso</h1>
              <p className="page-header__subtitle">Proceso propio del taller con su precio por hora.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Se espera la cotización: el formulario toma sus valores iniciales una sola vez. */}
      {exchangeRate.isPending ? (
        <p className="card">Cargando la cotización del dólar…</p>
      ) : (
        <ProcessTypeForm
          defaultValues={emptyProcessTypeForm(exchangeRate.data?.rate)}
          currentRate={exchangeRate.data}
          onSubmit={handleSubmit}
          onCancel={() => void navigate(LIST_PATH)}
          submitting={create.isPending}
          submitLabel="Registrar tipo de proceso"
        />
      )}
    </>
  )
}