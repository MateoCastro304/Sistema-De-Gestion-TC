import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession } from '@/app/providers/SessionContext'
import { canOpen } from '@/features/catalogs/panels'
import { AccessDeniedPage } from '@/app/router/AccessDeniedPage'

/**
 * Sin sesión, cualquier pantalla lleva al ingreso sin mostrar datos (CU-53,
 * escenario 7). Guarda la URL pedida para volver a ella después de ingresar.
 */
export function RequireSession() {
  const { user } = useSession()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/ingresar" replace state={{ from: location.pathname + location.search }} />
  }
  return <Outlet />
}

/**
 * Una pantalla que no permiten los roles muestra "Acceso denegado" dentro del
 * marco, sin montarla: así no pide sus datos (CU-53, escenario 8). La API
 * igual responde 403: esto sólo refleja lo que el backend ya decide.
 */
export function RequireAccess() {
  const { user } = useSession()
  const { pathname } = useLocation()

  if (!canOpen(pathname, user?.roles ?? [])) return <AccessDeniedPage />
  return <Outlet />
}
