import { parseDurationSeconds } from '../../../../shared/config/parse-duration';
import { SessionPolicy } from '../../core/domain/ports/session-policy.port';

type EnvReader = (key: string) => string | undefined;

/**
 * Tiempos de la sesión leídos del entorno. La duración máxima es
 * `JWT_REFRESH_EXPIRATION`: el refresh token vence con la sesión y renovarlo no
 * la extiende (D-44).
 */
export class ConfigSessionPolicy extends SessionPolicy {
  readonly refreshGraceSeconds = 30;
  readonly activityWriteIntervalSeconds = 60;

  private constructor(
    readonly inactivitySeconds: number,
    readonly maxLifetimeSeconds: number,
  ) {
    super();
  }

  static fromEnv(read: EnvReader): ConfigSessionPolicy {
    return new ConfigSessionPolicy(
      parseDurationSeconds(read('SESSION_INACTIVITY_TTL') ?? '30m'),
      parseDurationSeconds(read('JWT_REFRESH_EXPIRATION') ?? '7d'),
    );
  }
}
