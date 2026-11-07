// Puerta de entrada de la feature auth: lo único que se usa desde afuera.
export { refresh, logout } from './api/auth.api'
export { LoginPage } from './pages/LoginPage'
export type { SessionResponse, SessionUser } from './types/session'
