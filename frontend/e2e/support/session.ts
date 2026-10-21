import type { Page } from '@playwright/test'

/**
 * Sesiones para los tests. Los mocks guardan la sesión (lo que en el backend
 * real es la cookie del refresh token) en localStorage; acá se escribe esa
 * misma clave antes de que cargue la app, así el test arranca "logueado":
 * cuando la app pida `POST /auth/refresh` al iniciar, el mock la reconoce.
 *
 * Tiene que coincidir con `src/shared/mocks/session.ts` (clave y forma) y
 * con los usuarios de `src/features/catalogs/users/api/users.db.ts`.
 *
 * Mientras el login no exista, escribir la sesión no cambia nada: el
 * Sprint 1 no la pide. Por eso los tests del Sprint 1 ya arrancan con un
 * usuario con el rol que les corresponde y no hay que tocarlos el día que
 * se prenda la autenticación.
 */

const MOCK_SESSION_KEY = 'castro-mock-session'

/** Usuarios de ejemplo (la semilla del prototipo). Contraseña: {@link DEMO_PASSWORD}. */
export const USERS = {
  wcastro: { id: 1, firstName: 'Walter', roles: ['AS'] },
  mrios: { id: 2, firstName: 'Mónica', roles: ['ERP'] },
  fpaz: { id: 3, firstName: 'Federico', roles: ['EC'] },
  lbenitez: { id: 4, firstName: 'Lucía', roles: ['AT'] },
  rsanchez: { id: 5, firstName: 'Raúl', roles: ['JT'] },
  gtorres: { id: 6, firstName: 'Gabriela', roles: ['ER'] },
  dcastro: { id: 7, firstName: 'Daniel', roles: ['ERP', 'EC'] },
  /** Bloqueado por 5 intentos fallidos. */
  hfunes: { id: 8, firstName: 'Hugo', roles: ['AT'] },
  /** Dado de baja. */
  ogimenez: { id: 9, firstName: 'Omar', roles: ['ERP'] },
} as const

export type Username = keyof typeof USERS

export const DEMO_PASSWORD = 'Castro1977'

/** Cambios a la sesión abierta, para los escenarios que dependen del tiempo. */
interface SessionChanges {
  /** Pasaron los 15 minutos del `accessToken`: la próxima petición responde `ACCESS_TOKEN_EXPIRED`. */
  accessTokenExpired?: boolean
  /** El refresh token de la cookie ya fue reemplazado: el próximo refresh cierra la sesión (D-47). */
  refreshRevoked?: boolean
  /** Pasaron los 7 días desde el ingreso: la sesión vence aunque se use el sistema (D-44). */
  maxDurationReached?: boolean
}

/**
 * Cambia la sesión ya abierta en medio de un test, sin recargar. Se usa
 * después de que la app arrancó, porque el refresh del arranque renueva el
 * token. Escribe la misma clave que `src/shared/mocks/session.ts`.
 */
export async function changeSession(page: Page, changes: SessionChanges) {
  await page.evaluate(
    ({ key, changes }) => {
      const raw = localStorage.getItem(key)
      if (!raw) throw new Error('No hay una sesión abierta para cambiar')
      const session = JSON.parse(raw) as Record<string, unknown>
      if (changes.accessTokenExpired) session.accessTokenExpired = true
      if (changes.refreshRevoked) session.refreshRevoked = true
      if (changes.maxDurationReached) session.expiresAt = new Date(Date.now() - 1000).toISOString()
      localStorage.setItem(key, JSON.stringify(session))
    },
    { key: MOCK_SESSION_KEY, changes },
  )
}

interface SeedOptions {
  /** La sesión quedó cerrada por 30 minutos sin actividad. */
  expiredByInactivity?: boolean
}

/**
 * Deja una sesión abierta para `username` antes de la primera carga. Se
 * escribe una sola vez por pestaña: si el test cierra sesión y recarga, la
 * sesión no vuelve a aparecer.
 */
export async function seedSession(page: Page, username: Username, options: SeedOptions = {}) {
  const now = Date.now()
  const session = {
    sid: `e2e-${username}`,
    userId: USERS[username].id,
    startedAt: new Date(now).toISOString(),
    expiresAt: new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ...(options.expiredByInactivity ? { expiredByInactivity: true } : {}),
  }
  await page.addInitScript(
    ({ key, value }) => {
      if (sessionStorage.getItem('e2e-session-seeded')) return
      sessionStorage.setItem('e2e-session-seeded', '1')
      localStorage.setItem(key, value)
    },
    { key: MOCK_SESSION_KEY, value: JSON.stringify(session) },
  )
}
