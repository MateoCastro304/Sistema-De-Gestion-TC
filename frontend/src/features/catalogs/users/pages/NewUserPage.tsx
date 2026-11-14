import { Link, useNavigate, useSearchParams } from 'react-router'
import { useToast } from '@/app/providers/ToastContext'
import { isApiError } from '@/shared/api/ApiError'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoDispositivo from '@/assets/foto-dispositivo.webp'
import { useCreateUser, useEmployeeOption } from '../api/users.queries'
import { UserForm, type SetFieldError } from '../components/UserForm'
import { toUserCreate, type UserFormValues } from '../schemas/user.schema'
import { USERS_PATH, userDetailPath } from '../utils/paths'

/** Los campos del formulario que la API puede nombrar en `details`. */
const FORM_FIELDS = new Set<string>(['employeeId', 'username', 'password', 'roles'])

/** CU-05 Registrar usuario. */
export function NewUserPage() {
  const navigate = useNavigate()
  const showToast = useToast()
  const create = useCreateUser()

  // "Crear usuario" del detalle del empleado llega con `?employeeId=9`: ese
  // empleado ya aparece elegido. Sin el parámetro, el formulario arranca vacío.
  const [searchParams] = useSearchParams()
  const rawEmployeeId = searchParams.get('employeeId')
  const initialEmployeeId = rawEmployeeId === null ? null : Number(rawEmployeeId)
  const initialEmployee = useEmployeeOption(initialEmployeeId)

  const handleSubmit = (values: UserFormValues, setFieldError: SetFieldError) => {
    create.mutate(toUserCreate(values), {
      onSuccess: (created) => {
        showToast('success', 'Usuario registrado correctamente')
        void navigate(userDetailPath(created.id))
      },
      onError: (error) => {
        if (!isApiError(error)) {
          showToast('error', 'No se pudo registrar el usuario.')
          return
        }
        // 400 VALIDATION_ERROR, 409 USERNAME_TAKEN y EMPLOYEE_ALREADY_HAS_USER
        // dicen en `details` qué campo marcar: cada mensaje va en su campo.
        const fieldErrors = error.details.filter((detail) => FORM_FIELDS.has(detail.field))
        if (fieldErrors.length > 0) {
          fieldErrors.forEach((detail) => setFieldError(detail.field as keyof UserFormValues, detail.message))
          return
        }
        // 422 EMPLOYEE_INACTIVE no trae `details`, pero es sobre el empleado elegido.
        if (error.code === 'EMPLOYEE_INACTIVE') {
          setFieldError('employeeId', error.message)
          return
        }
        // Los mensajes del Sprint 2 ya vienen en castellano para el usuario.
        showToast('error', error.message)
      },
    })
  }

  return (
    <>
      <div className="page-header page-header--foto" style={heroPhoto(fotoDispositivo)}>
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link to={USERS_PATH} className="back-link">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Usuarios
            </Link>
            <div>
              <h1 className="page-header__title">Nuevo usuario</h1>
              <p className="page-header__subtitle">Cuenta de acceso para un empleado ya registrado.</p>
            </div>
          </div>
        </div>
      </div>

      {/* El formulario lee el empleado inicial al abrirse: se espera a tenerlo.
          Si no se encuentra, el formulario arranca vacío y se elige a mano. */}
      {initialEmployee.isLoading ? (
        <div className="empty-state">
          <p className="empty-state__text">Cargando empleado…</p>
        </div>
      ) : (
        <UserForm
          initialEmployee={initialEmployee.data ?? null}
          onSubmit={handleSubmit}
          onCancel={() => void navigate(USERS_PATH)}
          submitting={create.isPending}
        />
      )}
    </>
  )
}