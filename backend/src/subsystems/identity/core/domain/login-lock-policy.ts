/**
 * Política de bloqueo progresivo por intentos fallidos de ingreso.
 *
 * Es lógica de dominio pura: no tiene reloj propio, ni almacenamiento, ni HTTP.
 * Quien la llama le pasa el contador guardado y el instante actual, y recibe el
 * contador siguiente. Por eso la escala se puede probar a fondo sin base de
 * datos ni temporizadores falsos.
 *
 * Es un contador y no un registro de intentos: las únicas preguntas que
 * responde son "cuántos seguidos" y "hasta cuándo está bloqueado", y una sola
 * fila mutable responde las dos con un upsert. Un registro de intentos sería la
 * forma correcta para una auditoría, que es otro asunto con otra retención.
 */

/**
 * Estado guardado de una clave. `null` en quien llama significa que la clave no
 * tiene fallos registrados.
 *
 * `lockedUntil` se conserva aunque ya haya vencido: {@link applyFailure} mide
 * desde ahí la ventana de decaimiento, y olvidarlo haría imposible escalar.
 */
export type LoginAttemptRecord = {
  readonly failures: number;
  readonly lastFailedAt: Date;
  readonly lockedUntil: Date | null;
};

/**
 * Contra qué se cuenta un nivel. El adaptador lo convierte en la clave de
 * almacenamiento; al dominio solo le importa que dos intentos comparten
 * contador si coinciden en los campos del alcance.
 */
export type LoginLockScope = 'username' | 'username+ip';

/**
 * Un nivel de la política. Hay dos, con alcances y umbrales distintos, porque
 * frenan ataques distintos: el de usuario+IP frena a quien prueba claves sobre
 * una cuenta desde un mismo origen sin dejar fuera al usuario real, y el de solo
 * usuario contiene los ataques distribuidos entre muchas IP.
 *
 * - `threshold`: se bloquea en cada N.º fallo consecutivo.
 * - `windowSeconds`: los fallos más viejos que esto decaen a cero, así quien se
 *   equivoca una vez al mes nunca acumula un bloqueo.
 * - `ladderSeconds`: duración del bloqueo por nivel de escalada. El último paso
 *   se repite para siempre, y eso es lo que topea la escalada.
 *
 * Los valores vienen del entorno (`LOGIN_LOCK_*`); el dominio solo describe la
 * forma.
 */
export type LoginLockTier = {
  readonly scope: LoginLockScope;
  readonly threshold: number;
  readonly windowSeconds: number;
  readonly ladderSeconds: readonly number[];
};

/**
 * Tope del último paso de la escala, en segundos (24 horas).
 *
 * Es generoso (el último paso recomendado es de una hora) porque es una
 * protección contra un error de tipeo, no la política. Lo que descarta es la
 * escala sin techo.
 */
export const MAX_LOCK_SECONDS = 24 * 60 * 60;

/**
 * Rechaza un nivel que la política no puede cumplir, con un mensaje que nombra
 * la variable a corregir. Se llama al construir el adaptador para que un valor
 * malo falle el arranque y no el primer ingreso del día.
 *
 * @throws {Error} si el nivel nunca bloquearía, nunca liberaría o escalaría hacia atrás.
 */
export function assertUsableTier(tier: LoginLockTier, prefix: string): void {
  if (!Number.isInteger(tier.threshold) || tier.threshold < 1) {
    throw new Error(`${prefix}_THRESHOLD tiene que ser un entero de al menos 1; llegó ${tier.threshold}.`);
  }

  if (tier.ladderSeconds.length === 0) {
    throw new Error(
      `${prefix}_LADDER tiene que listar al menos una duración: sin ninguna, se alcanzaría el umbral y nunca se bloquearía.`,
    );
  }

  // El último paso se repite para siempre: una escala sin techo es un bloqueo
  // permanente esperando a pasar, y quien conozca un username podría mantener
  // esa cuenta cerrada a voluntad.
  const longest = tier.ladderSeconds[tier.ladderSeconds.length - 1];
  if (longest > MAX_LOCK_SECONDS) {
    throw new Error(
      `${prefix}_LADDER llega a ${longest}s, por encima del tope de ${MAX_LOCK_SECONDS}s. El último paso se repite indefinidamente.`,
    );
  }

  const ascends = tier.ladderSeconds.every((seconds, index) => index === 0 || seconds >= tier.ladderSeconds[index - 1]);
  if (!ascends) {
    throw new Error(`${prefix}_LADDER no puede decrecer: una reincidencia no merece un bloqueo menor que la anterior.`);
  }
}

/**
 * Segundos que le quedan al bloqueo, o `0` si la clave no está bloqueada.
 *
 * Se redondea hacia arriba: informar `0` a un cliente que sigue bloqueado 400 ms
 * invitaría a un reintento inmediato que volvería a fallar, y un `Retry-After: 0`
 * se lee como "adelante".
 */
export function remainingLockSeconds(record: LoginAttemptRecord | null, now: Date): number {
  if (record === null || record.lockedUntil === null) {
    return 0;
  }

  const remainingMs = record.lockedUntil.getTime() - now.getTime();
  return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
}

/**
 * Contador siguiente después de un intento fallido.
 *
 * La ventana de decaimiento se mide desde el **fin del bloqueo anterior**, no
 * desde el último fallo. Medirla desde el último fallo haría imposible subir la
 * escala cuando un bloqueo dura más que la ventana: uno de 60 min con ventana de
 * 15 min ya habría decaído cuando el usuario puede volver a intentar, y todo
 * bloqueo sería de nivel 1. Contar desde que la clave quedó usable le da al
 * atacante exactamente `threshold` intentos por nivel, que es la intención.
 *
 * Acá no se decide si el intento estaba permitido: una clave bloqueada se
 * rechaza antes de verificar la contraseña, así que esto solo se llama para
 * intentos que realmente corrieron.
 */
export function applyFailure(tier: LoginLockTier, record: LoginAttemptRecord | null, now: Date): LoginAttemptRecord {
  const failures = nextFailureCount(tier, record, now);
  const level = failures % tier.threshold === 0 ? failures / tier.threshold : 0;

  if (level === 0) {
    return {
      failures,
      lastFailedAt: now,
      // Se arrastra, no se relee: un bloqueo pasado es el ancla de la ventana.
      lockedUntil: failures === 1 ? null : (record?.lockedUntil ?? null),
    };
  }

  const index = Math.min(level, tier.ladderSeconds.length) - 1;
  return {
    failures,
    lastFailedAt: now,
    lockedUntil: new Date(now.getTime() + tier.ladderSeconds[index] * 1000),
  };
}

function nextFailureCount(tier: LoginLockTier, record: LoginAttemptRecord | null, now: Date): number {
  if (record === null) {
    return 1;
  }

  const decayFrom =
    record.lockedUntil !== null && record.lockedUntil.getTime() > record.lastFailedAt.getTime()
      ? record.lockedUntil
      : record.lastFailedAt;

  const elapsedSeconds = (now.getTime() - decayFrom.getTime()) / 1000;
  return elapsedSeconds > tier.windowSeconds ? 1 : record.failures + 1;
}
