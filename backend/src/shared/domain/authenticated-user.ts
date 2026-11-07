/**
 * El usuario que hace la petición, ya verificado: su sesión del servidor está
 * abierta y sus roles y permisos son los **vigentes** en este momento, no los que
 * tenía al ingresar (RNF09). Lo deja el guard de sesión en la request y los
 * controladores lo piden con `@CurrentUser()`.
 *
 * Vive en `shared` para que cualquier subsistema lo use sin depender de `identity`.
 */
export type AuthenticatedUser = {
  userId: number;
  sessionId: string;
  roles: readonly string[];
  permissions: readonly string[];
};
