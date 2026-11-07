/**
 * Tiempos de la sesión, como configuración y no como constantes del dominio: se
 * ajustan por entorno sin tocar el código (`SESSION_INACTIVITY_TTL`,
 * `JWT_REFRESH_EXPIRATION`).
 */
export abstract class SessionPolicy {
  /** Sin actividad durante este tiempo, la sesión se cierra (30 minutos). */
  abstract readonly inactivitySeconds: number;

  /** Duración máxima de una sesión desde el ingreso; renovar el token no la extiende (7 días, D-44). */
  abstract readonly maxLifetimeSeconds: number;

  /** Margen en el que se tolera el refresh token recién rotado (30 segundos, D-47). */
  abstract readonly refreshGraceSeconds: number;

  /** La actividad se escribe como mucho una vez por este intervalo (60 segundos). */
  abstract readonly activityWriteIntervalSeconds: number;
}
