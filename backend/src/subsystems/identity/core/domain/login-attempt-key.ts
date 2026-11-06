import { createHash } from 'node:crypto';
import { LoginAttemptContext } from './ports/login-throttle.port';
import { LoginLockScope } from './login-lock-policy';

/** Largo máximo de un username real (`app_user.username`). */
const MAX_USERNAME_LENGTH = 30;
/** Largo máximo de una IP en texto (IPv6 completa con la forma IPv4 mapeada). */
const MAX_IP_LENGTH = 45;

/**
 * Un valor que entra a la clave. Lo que no puede ser un valor real (más largo que
 * el máximo, o con un carácter nulo, que PostgreSQL rechaza en texto) se reemplaza
 * por un hash.
 *
 * Es un hash y no un recorte a propósito: recortar haría que "<username real>
 * seguido de basura" comparta contador con el usuario real, y cualquiera podría
 * bloquearlo con solo mandar su nombre más un sufijo. El hash no colisiona con un
 * username real salvo que este empiece con `~` y siga con 28 hexadecimales.
 */
function keyPart(value: string, maxLength: number): string {
  if (value.length <= maxLength && !value.includes('\u0000')) return value;
  return `~${createHash('sha256').update(value).digest('hex').slice(0, 28)}`;
}

/**
 * Clave del contador de intentos fallidos (`login_attempt.identifier`, 120
 * caracteres). El login es público, así que la clave se arma con datos de un
 * desconocido: no puede romper la columna ni la consulta, porque eso sería un 500
 * en el endpoint más expuesto. Con valores normales queda legible
 * (`u:dcastro|ip:10.0.0.1`); el máximo posible es de 81 caracteres.
 */
export function loginAttemptKey(scope: LoginLockScope, { username, ip }: LoginAttemptContext): string {
  const user = `u:${keyPart(username, MAX_USERNAME_LENGTH)}`;
  return scope === 'username+ip' ? `${user}|ip:${keyPart(ip, MAX_IP_LENGTH)}` : user;
}
