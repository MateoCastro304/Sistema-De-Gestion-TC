/**
 * URLs de la feature. Son las que esperan los tests E2E
 * (`e2e/support/routes.ts`): el router de `app/` las tiene que usar igual.
 */
export const USERS_PATH = '/administracion/usuarios'
export const NEW_USER_PATH = `${USERS_PATH}/nuevo`

export function userDetailPath(id: number): string {
  return `${USERS_PATH}/${id}`
}
