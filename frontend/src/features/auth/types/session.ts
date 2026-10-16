import type { Rol } from '@/domain/roles'

/**
 * Sesión (CU-53 Iniciar sesión, CU-52 Cerrar sesión), con la forma del
 * contrato del Sprint 2 (§3.1). El `accessToken` se guarda en memoria; el
 * refresh token viaja sólo en la cookie HttpOnly y el código no lo ve.
 */

export interface LoginRequest {
  username: string
  password: string
}

/** El usuario de la sesión: misma forma que `GET /users/{userId}`. */
export interface SessionUser {
  id: number
  username: string
  employee: { id: number; firstName: string; lastName: string }
  roles: Rol[]
  status: 'ACTIVE' | 'BLOCKED' | 'INACTIVE'
  lastAccessAt: string | null
  createdAt: string
}

/** Respuesta de `POST /auth/login` y de `POST /auth/refresh`. */
export interface SessionResponse {
  accessToken: string
  tokenType: 'Bearer'
  /** Segundos de vida del accessToken (900). */
  expiresIn: number
  /** Segundos sin actividad tras los que se cierra la sesión (1800). */
  inactivityTimeoutSeconds: number
  /** Fin de la sesión por su duración máxima: el ingreso más 7 días. */
  sessionExpiresAt: string
  user: SessionUser
}
