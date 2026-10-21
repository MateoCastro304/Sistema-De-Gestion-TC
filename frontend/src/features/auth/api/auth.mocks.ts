import { http, HttpResponse } from 'msw'
import { apiError, validationError, type FieldError } from '@/shared/mocks/errors'
import { closeSession, currentSession, issueAccessToken, openSession, saveSession, type MockSession } from '@/shared/mocks/session'
import { findUser, toUserResponse, usersDb, type UserRow } from '@/features/catalogs/users/api/users.db'
import type { LoginRequest, SessionResponse } from '../types/session'

/**
 * MSW handlers de la sesión (CU-53 Iniciar sesión, CU-52 Cerrar sesión), según
 * el contrato del Sprint 2 (§3.1). La "cookie" del refresh token es la sesión
 * guardada en localStorage por `shared/mocks/session.ts`: así recargar la
 * página no cierra la sesión, como con la cookie real.
 *
 * Usuarios de ejemplo (contraseña Castro1977): wcastro (AS), mrios (ERP),
 * fpaz (EC), lbenitez (AT), rsanchez (JT), gtorres (ER), dcastro (ERP + EC),
 * hfunes (bloqueado) y ogimenez (dado de baja).
 */

/** Al quinto intento fallido consecutivo el usuario queda bloqueado (RNF08). */
const MAX_FAILED_ATTEMPTS = 5

const BLOCKED_MESSAGE = 'Tu usuario fue bloqueado por intentos fallidos. Contactá al Administrador del Sistema.'

function sessionResponse(session: MockSession, user: UserRow): SessionResponse {
  return {
    accessToken: issueAccessToken(session, user.roles),
    tokenType: 'Bearer',
    expiresIn: 900,
    inactivityTimeoutSeconds: 1800,
    sessionExpiresAt: session.expiresAt,
    user: toUserResponse(user),
  }
}

function invalidCredentials(request: Request) {
  return apiError(request, 401, 'Usuario o contraseña incorrectos', { code: 'INVALID_CREDENTIALS' })
}

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as Partial<LoginRequest>
    const username = body.username?.trim() ?? ''
    const password = body.password ?? ''

    // Campo vacío: 400 antes de autenticar, y no cuenta como intento.
    const details: FieldError[] = []
    if (!username) details.push({ field: 'username', message: 'Ingresá tu nombre de usuario' })
    if (!password) details.push({ field: 'password', message: 'Ingresá tu contraseña' })
    if (details.length > 0) return validationError(request, details)

    const user = usersDb.users.find((u) => u.username.toLowerCase() === username.toLowerCase())
    // Inexistente o dado de baja: el mismo mensaje que una contraseña mala, y no suma intentos.
    if (!user || !user.active) return invalidCredentials(request)
    // Bloqueado: se rechaza aunque la contraseña sea la correcta.
    if (user.blocked) return apiError(request, 423, BLOCKED_MESSAGE, { code: 'USER_BLOCKED' })

    if (user.password !== password) {
      user.failedAttempts += 1
      if (user.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        user.blocked = true
        return apiError(request, 423, BLOCKED_MESSAGE, { code: 'USER_BLOCKED' })
      }
      return invalidCredentials(request)
    }

    user.failedAttempts = 0
    const session = openSession(user.id)
    user.lastAccessAt = session.startedAt
    return HttpResponse.json(sessionResponse(session, user))
  }),

  // Sin cuerpo ni Authorization: la sesión sale de la "cookie".
  http.post('/api/auth/refresh', ({ request }) => {
    const session = currentSession()
    if (!session) {
      return apiError(request, 401, 'La autenticación es requerida.', { code: 'UNAUTHENTICATED' })
    }
    // Refresh token ya reemplazado: se toma como robado y se cierra la sesión (D-47).
    if (session.refreshRevoked) {
      closeSession()
      return apiError(request, 401, 'La autenticación es requerida.', { code: 'UNAUTHENTICATED' })
    }
    if (session.expiredByInactivity) {
      closeSession()
      return apiError(request, 401, 'Tu sesión expiró por inactividad', { code: 'SESSION_EXPIRED' })
    }
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      closeSession()
      return apiError(request, 401, 'Tu sesión expiró. Volvé a ingresar.', { code: 'SESSION_EXPIRED' })
    }
    const user = findUser(session.userId)
    if (!user || !user.active || user.blocked) {
      closeSession()
      return apiError(request, 401, 'La autenticación es requerida.', { code: 'UNAUTHENTICATED' })
    }
    // Rota el token pero no estira la sesión: mismo `sessionExpiresAt`. El
    // token nuevo ya no está vencido.
    if (session.accessTokenExpired) saveSession({ ...session, accessTokenExpired: false })
    return HttpResponse.json(sessionResponse(session, user))
  }),

  // Siempre 204, aunque la sesión ya no exista (CU-52, escenario 5).
  http.post('/api/auth/logout', () => {
    closeSession()
    return new HttpResponse(null, { status: 204 })
  }),
]
