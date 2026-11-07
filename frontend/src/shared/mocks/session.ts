import { apiError } from './errors'

/**
 * Sesión simulada de los mocks (contrato del Sprint 2, §3.1 y §4 "Sesión").
 *
 * En el backend real la sesión vive en el servidor y el refresh token viaja
 * en una cookie HttpOnly. Acá no hay servidor: lo que haría de cookie se
 * guarda en `localStorage`, así la sesión sobrevive a una recarga igual que
 * con la cookie (al recargar, el cliente pide `POST /auth/refresh`).
 *
 * El `accessToken` lleva adentro la sesión, el usuario y sus roles. Un token
 * vale mientras su sesión siga siendo la guardada: cerrar sesión la borra y,
 * desde la petición siguiente, el token responde 401 aunque "no haya
 * vencido" (CU-52, escenario 3).
 *
 * Los tests E2E arrancan con una sesión ya abierta escribiendo esta misma
 * clave antes de que cargue la app (ver `e2e/support/session.ts`).
 */

export const MOCK_SESSION_KEY = 'castro-mock-session'

export interface MockSession {
  sid: string
  userId: number
  /** Inicio de la sesión, ISO 8601. */
  startedAt: string
  /** Fin por duración máxima: el inicio más 7 días. */
  expiresAt: string
  /** Simula la sesión cerrada por 30 minutos sin actividad. */
  expiredByInactivity?: boolean
  /**
   * Simula el `accessToken` vencido (15 minutos): las peticiones responden
   * `401 ACCESS_TOKEN_EXPIRED` hasta el próximo `POST /auth/refresh`.
   */
  accessTokenExpired?: boolean
  /**
   * Simula que el refresh token de la cookie ya fue reemplazado (D-47): el
   * próximo `POST /auth/refresh` lo toma como robado y cierra la sesión.
   */
  refreshRevoked?: boolean
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function readStorage(): MockSession | null {
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY)
    return raw ? (JSON.parse(raw) as MockSession) : null
  } catch {
    return null
  }
}

export function currentSession(): MockSession | null {
  return readStorage()
}

export function openSession(userId: number): MockSession {
  const now = new Date()
  const session: MockSession = {
    sid: crypto.randomUUID(),
    userId,
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + SEVEN_DAYS_MS).toISOString(),
  }
  saveSession(session)
  return session
}

export function saveSession(session: MockSession): void {
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session))
}

export function closeSession(): void {
  localStorage.removeItem(MOCK_SESSION_KEY)
}

interface TokenPayload {
  sid: string
  uid: number
  roles: string[]
}

export function issueAccessToken(session: MockSession, roles: string[]): string {
  const payload: TokenPayload = { sid: session.sid, uid: session.userId, roles }
  return `mock.${btoa(JSON.stringify(payload))}`
}

function readToken(request: Request): TokenPayload | null {
  const header = request.headers.get('Authorization') ?? ''
  const match = /^Bearer mock\.(.+)$/.exec(header)
  if (!match) return null
  try {
    return JSON.parse(atob(match[1])) as TokenPayload
  } catch {
    return null
  }
}

export interface Caller {
  userId: number
  roles: string[]
}

/**
 * Verifica la sesión y el rol de una petición. Devuelve quién llama, o la
 * respuesta de error para que el handler la devuelva tal cual:
 *   - sin token, token desconocido o sesión cerrada → 401 UNAUTHENTICATED;
 *   - sesión vencida por sus 7 días o por inactividad → 401 SESSION_EXPIRED;
 *   - accessToken vencido → 401 ACCESS_TOKEN_EXPIRED;
 *   - sin ninguno de los roles pedidos → 403 FORBIDDEN.
 *
 *   const caller = authorize(request, ['AT', 'EC'])
 *   if (caller instanceof Response) return caller
 */
export function authorize(request: Request, roles: readonly string[]): Caller | Response {
  const token = readToken(request)
  const session = readStorage()
  if (!token || !session || session.sid !== token.sid) {
    return apiError(request, 401, 'La autenticación es requerida.', { code: 'UNAUTHENTICATED' })
  }
  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return apiError(request, 401, 'Tu sesión expiró. Volvé a ingresar.', { code: 'SESSION_EXPIRED' })
  }
  if (session.expiredByInactivity) {
    return apiError(request, 401, 'Tu sesión expiró por inactividad', { code: 'SESSION_EXPIRED' })
  }
  if (session.accessTokenExpired) {
    return apiError(request, 401, 'El token de acceso expiró.', { code: 'ACCESS_TOKEN_EXPIRED' })
  }
  if (!roles.some((role) => token.roles.includes(role))) {
    return apiError(request, 403, 'No tenés permisos para realizar esta operación.', { code: 'FORBIDDEN' })
  }
  return { userId: token.uid, roles: token.roles }
}
