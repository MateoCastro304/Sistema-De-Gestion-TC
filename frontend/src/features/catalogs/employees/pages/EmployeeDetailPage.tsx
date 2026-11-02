import { Link, useParams } from 'react-router'
import { Avatar, Badge } from '@/shared/components/ui'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import { cn } from '@/shared/lib/cn'
import { toneByStatus } from '@/shared/lib/rowTone'
import { formatPhone } from '@/shared/lib/formatPhone'
import { isApiError } from '@/shared/api/ApiError'
import { ROL_LABEL } from '@/domain/roles'
import { useCrumbTitle } from '@/app/providers/BreadcrumbContext'
import fotoPrensa from '@/assets/foto-prensa.webp'
import { EMPLOYEE_POSITION_LABELS } from '../types/employee'
import { useEmployee } from '../api/employees.queries'

const LIST_PATH = '/administracion/empleados'

/** Un dato en lectura; sin valor muestra el texto de "vacío". */
function Field({ label, value, empty }: { label: string; value: string | null | undefined; empty: string }) {
  return (
    <div className="field">
      <span className="field__label">{label}</span>
      <span className={cn('field__value', !value && 'field__value--muted')}>{value || empty}</span>
    </div>
  )
}

/**
 * Detalle de un empleado. Es lo que se abre al registrarlo (CU-45) y muestra
 * su usuario o, si no tiene, el acceso opcional para crearlo.
 */
export function EmployeeDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { data: employee, isLoading, isError, error } = useEmployee(Number(id))

  useCrumbTitle(employee ? `${employee.firstName} ${employee.lastName}` : undefined)

  if (isLoading) {
    return (
      <div className="empty-state">
        <p className="empty-state__text">Cargando empleado…</p>
      </div>
    )
  }

  if (isError || !employee) {
    const notFound = isApiError(error) && error.isNotFound
    return (
      <EmptyState
        card
        kind={notFound ? 'no-results' : 'error'}
        title={notFound ? 'No encontramos el empleado que buscabas.' : 'No se pudo cargar el empleado.'}
        action={
          <Link className="btn btn--secondary" to={LIST_PATH}>
            Volver a Empleados
          </Link>
        }
      >
        {notFound ? 'Puede que no exista.' : 'Revisá la conexión e intentá de nuevo.'}
      </EmptyState>
    )
  }

  const fullName = `${employee.firstName} ${employee.lastName}`
  const { user } = employee

  return (
    <>
      <div className="page-header page-header--foto" style={heroPhoto(fotoPrensa)}>
        <div className="page-header__row">
          <div className="detail-header__left">
            <Link to={LIST_PATH} className="back-link">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Empleados
            </Link>
            <Avatar name={fullName} icon="empleado" tone={toneByStatus(employee.active)} size="lg" shape="round" />
            <div>
              <div className="detail-header__title-row">
                <h1 className="page-header__title">{fullName}</h1>
                {!employee.active && <Badge variant="neutral">Inactivo</Badge>}
              </div>
              <p className="page-header__subtitle">
                {EMPLOYEE_POSITION_LABELS[employee.position]} ·{' '}
                {user ? `Usuario ${user.username}` : 'Sin usuario en el sistema'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <section className="card">
            <h2 className="card__title">Datos personales</h2>
            <div className="card__grid card__grid--2">
              <Field label="Nombre" value={employee.firstName} empty="—" />
              <Field label="Apellido" value={employee.lastName} empty="—" />
              <Field label="DNI" value={employee.dni} empty="—" />
              <Field label="Puesto" value={EMPLOYEE_POSITION_LABELS[employee.position]} empty="—" />
            </div>
          </section>
          <section className="card">
            <h2 className="card__title">Contacto</h2>
            <div className="card__grid card__grid--2">
              <Field label="Dirección" value={employee.address} empty="Sin dirección" />
              <Field label="Email" value={employee.email} empty="Sin email" />
              <Field label="Teléfono" value={formatPhone(employee.phone)} empty="Sin teléfono" />
            </div>
          </section>
        </div>

        <aside className="detail-aside">
          <section className="card card--dark">
            <h2 className="card__title">Usuario del sistema</h2>
            <div className="aside-list">
              {user ? (
                <>
                  <div className="field">
                    <span className="field__label">Nombre de usuario</span>
                    <span className="field__value">{user.username}</span>
                  </div>
                  <div className="field">
                    <span className="field__label">Roles</span>
                    <span className="field__value">{user.roles.map((role) => ROL_LABEL[role]).join(', ')}</span>
                  </div>
                </>
              ) : (
                <>
                  <p className="field__value">
                    {employee.active ? 'Este empleado todavía no tiene usuario.' : 'Este empleado no tiene usuario.'}
                  </p>
                  {employee.active && (
                    <Link className="aside-link" to={`/administracion/usuarios/nuevo?employeeId=${employee.id}`}>
                      Crear usuario
                    </Link>
                  )}
                </>
              )}
            </div>
          </section>
        </aside>
      </div>
    </>
  )
}
