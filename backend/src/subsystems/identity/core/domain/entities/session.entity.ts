import { SessionEndReason } from '../value-objects/session-end-reason';

/**
 * Estado de una sesión en un instante dado.
 *
 * - `ENDED`: ya se cerró (logout, vencimiento detectado antes, robo de refresh).
 * - `EXPIRED`: llegó a su duración máxima (D-44).
 * - `INACTIVE`: pasó el tiempo de inactividad sin actividad.
 */
export type SessionState = 'ACTIVE' | 'ENDED' | 'EXPIRED' | 'INACTIVE';

/**
 * Sesión del servidor (D-04): una fila por ingreso. Se verifica en cada
 * petición, además del access token, así que cerrarla corta el acceso aunque el
 * token todavía no haya vencido.
 */
export class Session {
  private constructor(
    private readonly id: string,
    private readonly userId: number,
    private readonly startedAt: Date,
    private readonly lastActivityAt: Date,
    private readonly expiresAt: Date,
    private readonly endedAt: Date | null,
    private readonly endReason: SessionEndReason | null,
  ) {}

  static reconstruct(data: {
    id: string;
    userId: number;
    startedAt: Date;
    lastActivityAt: Date;
    expiresAt: Date;
    endedAt: Date | null;
    endReason: SessionEndReason | null;
  }): Session {
    return new Session(
      data.id,
      data.userId,
      data.startedAt,
      data.lastActivityAt,
      data.expiresAt,
      data.endedAt,
      data.endReason,
    );
  }

  /**
   * Estado de la sesión en `now`. Si se cumplen varias causas gana la más
   * estricta: cerrada, después vencida por duración y por último inactiva.
   */
  check(now: Date, inactivitySeconds: number): SessionState {
    if (this.endedAt !== null) return 'ENDED';
    if (now.getTime() >= this.expiresAt.getTime()) return 'EXPIRED';
    if (now.getTime() - this.lastActivityAt.getTime() >= inactivitySeconds * 1000) return 'INACTIVE';
    return 'ACTIVE';
  }

  /**
   * Cada UPDATE genera una versión nueva de la fila (MVCC): la actividad se
   * escribe como mucho una vez por `minIntervalSeconds`, no en cada petición.
   */
  needsActivityUpdate(now: Date, minIntervalSeconds: number): boolean {
    return now.getTime() - this.lastActivityAt.getTime() >= minIntervalSeconds * 1000;
  }

  getId(): string {
    return this.id;
  }
  getUserId(): number {
    return this.userId;
  }
  getStartedAt(): Date {
    return this.startedAt;
  }
  getLastActivityAt(): Date {
    return this.lastActivityAt;
  }
  getExpiresAt(): Date {
    return this.expiresAt;
  }
  getEndedAt(): Date | null {
    return this.endedAt;
  }
  getEndReason(): SessionEndReason | null {
    return this.endReason;
  }
}
