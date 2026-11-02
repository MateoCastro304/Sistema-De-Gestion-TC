/** Quién intenta ingresar: el username normalizado y la IP de quien llama. */
export type LoginAttemptContext = { readonly username: string; readonly ip: string };

/**
 * Bloqueo progresivo por intentos fallidos. Cuenta también los usernames que no
 * existen: si no, la respuesta revelaría qué usuarios hay (enumeración de
 * cuentas). El detalle de los niveles está en `login-lock-policy.ts`.
 */
export abstract class LoginThrottle {
  /** Segundos que faltan para poder reintentar, o `0` si no está bloqueado. */
  abstract remainingLockSeconds(context: LoginAttemptContext): Promise<number>;

  /** Cuenta un intento fallido. Devuelve los segundos de bloqueo si este intento lo disparó, o `0`. */
  abstract recordFailure(context: LoginAttemptContext): Promise<number>;

  /** Borra los contadores: un ingreso correcto no deja nada pendiente. */
  abstract recordSuccess(context: LoginAttemptContext): Promise<void>;
}
