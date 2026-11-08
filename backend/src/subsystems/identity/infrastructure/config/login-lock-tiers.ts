import { parseDurationListSeconds, parseDurationSeconds } from '../../../../shared/config/parse-duration';
import { LoginLockTier, assertUsableTier } from '../../core/domain/login-lock-policy';

type EnvReader = (key: string) => string | undefined;

/**
 * Lee un nivel de la política del entorno, con sus valores por defecto, y lo
 * valida: un valor malo falla el arranque nombrando la variable, no el primer
 * ingreso del día.
 */
function readTier(
  read: EnvReader,
  prefix: string,
  scope: LoginLockTier['scope'],
  defaults: { threshold: number; window: string; ladder: string },
): LoginLockTier {
  const tier: LoginLockTier = {
    scope,
    threshold: Number(read(`${prefix}_THRESHOLD`) ?? defaults.threshold),
    windowSeconds: parseDurationSeconds(read(`${prefix}_WINDOW`) ?? defaults.window),
    ladderSeconds: parseDurationListSeconds(read(`${prefix}_LADDER`) ?? defaults.ladder),
  };
  assertUsableTier(tier, prefix);
  return tier;
}

/**
 * Los dos niveles del bloqueo de ingreso, de mayor a menor especificidad:
 *
 * - **usuario + IP** (`LOGIN_LOCK_*`): frena a quien prueba claves sobre una
 *   cuenta desde un mismo origen, sin dejar fuera al usuario real que entra
 *   desde otra IP. Por defecto 5 fallos, ventana de 15 min, escala
 *   90 s, 5 m, 15 m, 30 m, 1 h.
 * - **solo usuario** (`LOGIN_LOCK_USER_*`): contiene los ataques distribuidos
 *   entre muchas IP. Más permisivo, para que no sea fácil dejar fuera a un
 *   usuario ajeno. Por defecto 25 fallos, ventana de 1 h, bloqueo de 15 min.
 */
export function loginLockTiers(read: EnvReader): LoginLockTier[] {
  return [
    readTier(read, 'LOGIN_LOCK', 'username+ip', { threshold: 5, window: '15m', ladder: '90s,5m,15m,30m,1h' }),
    readTier(read, 'LOGIN_LOCK_USER', 'username', { threshold: 25, window: '1h', ladder: '15m' }),
  ];
}
