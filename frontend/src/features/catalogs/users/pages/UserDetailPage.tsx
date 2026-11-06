import { Link, useParams } from 'react-router'
import { useCrumbTitle } from '@/app/providers/BreadcrumbContext'
import { ROL_LABEL } from '@/domain/roles'
import { isApiError } from '@/shared/api/ApiError'
import { EmptyState } from '@/shared/components/feedback/EmptyState'
import { heroPhoto } from '@/shared/lib/heroPhoto'
import fotoDispositivo from '@/assets/foto-dispositivo.webp'
import { useUser } from '../api/users.queries'
import { USER_STATUS_LABELS, type UserStatus } from '../types/user'
import { formatLongDateTime } from '../utils/dates'
import { USERS_PATH } from '../utils/paths'

/** El aviso del prototipo cuando el usuario no puede ingresar. */
const STATUS_BANNERS: Partial<Record<UserStatus, string>> = {
  INACTIVE: 'Este usuario está inactivo: no puede ingresar al sistema.',
  BLOCKED: 'Este usuario está bloqueado por 5 intentos fallidos de ingreso: no puede ingresar al sistema.',
}

/**
 * Detalle de un usuario (CU-07): a donde lleva el alta. Modificar y dar de
 * baja (CU-06, CU-08) son "A futuro" en el prototipo y no están acá.
 */
export function UserDetailPage() {
  const { id } = useParams<{ id: string }>()
  // La URL trae texto; el contrato define el id como entero. "abc" → NaN.
  const userId = Number(id)
  const { data: user, isPending, error } = useUser(userId)
  useCrumbTitle(user?.username)

  const notFound = !Number.isInteger(userId) || userId <= 0 || (isApiError(error) && error.isNotFound)

  if (notFound) {
    return (
      <EmptyState
        card
        kind="no-results"
        title="No encontramos el usuario que buscabas."
        action={<Link className="btn btn--secondary" to={USERS_PATH}>Volver al listado</Link>}
      />
    )
  }

  if (error) {
    return (
      <EmptyState
        card
        kind="error"
        title="No se pudo cargar el usuario."
        action={<Link className="btn btn--secondary" to={USERS_PATH}>Volver al listado</Link>}
      >
        {isApiError(error) ? error.message : 'Revisá la conexión e intentá de nuevo.'}
      </EmptyState>
    )
  }

  if (isPending) {
    return (
      <div className="empty-state">
        <p className="empty-state__text">Cargando usuario…</p>
      </div>
    )
  }

  const employeeName = `${user.employee.firstName} ${user.employee.lastName}`
  const banner = STATUS_BANNERS[user.status]

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
              <h1 className="page-header__title">{user.username}</h1>
              <p className="page-header__subtitle">{employeeName}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          {banner && (
            <p className="field-alert" role="status">
              {banner}
            </p>
          )}

          <section className="card">
            <h2 className="card__title">Datos del usuario</h2>
            <div className="card__grid card__grid--2">
              <div className="field">
                <span className="field__label">Nombre de usuario</span>
                <span className="field__value">{user.username}</span>
              </div>
              <div className="field">
                <span className="field__label">Empleado</span>
                <span className="field__value">{employeeName}</span>
              </div>
              <div className="field">
                <span className="field__label">Estado</span>
                <span className="field__value">{USER_STATUS_LABELS[user.status]}</span>
              </div>
              <div className="field">
                <span className="field__label">Último acceso</span>
                {user.lastAccessAt ? (
                  <span className="field__value">{formatLongDateTime(user.lastAccessAt)}</span>
                ) : (
                  <span className="field__value field__value--muted">Nunca ingresó</span>
                )}
              </div>
              <div className="field card__full">
                <span className="field__label">Roles</span>
                <span className="roles-select__chips">
                  {user.roles.map((role) => (
                    <span key={role} className="badge badge--suave">
                      {ROL_LABEL[role]}
                    </span>
                  ))}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
