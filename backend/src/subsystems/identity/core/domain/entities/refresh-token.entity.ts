/**
 * Qué significa que alguien presente este refresh token ahora.
 *
 * - `CURRENT`: es el token vigente de la sesión.
 * - `ROTATED_WITHIN_GRACE`: ya fue reemplazado, pero hace muy poco. Se tolera
 *   para que dos pestañas que renuevan a la vez no se cierren la sesión (D-47).
 * - `REUSED`: fue reemplazado o revocado hace más que el margen, o la sesión se
 *   cerró. Se lo considera robado y se cierra la sesión entera.
 */
export type RefreshTokenUse = 'CURRENT' | 'ROTATED_WITHIN_GRACE' | 'REUSED';

/**
 * Un eslabón de la cadena de rotación de refresh tokens de una sesión (D-47).
 * Solo se guarda el hash SHA-256: el token en claro es aleatorio, opaco y viaja
 * únicamente en la cookie `HttpOnly`.
 */
export class RefreshToken {
  private constructor(
    private readonly id: string,
    private readonly tokenHash: string,
    private readonly sessionId: string,
    private readonly replacedBy: string | null,
    private readonly createdAt: Date,
    private readonly revokedAt: Date | null,
  ) {}

  static reconstruct(data: {
    id: string;
    tokenHash: string;
    sessionId: string;
    replacedBy: string | null;
    createdAt: Date;
    revokedAt: Date | null;
  }): RefreshToken {
    return new RefreshToken(data.id, data.tokenHash, data.sessionId, data.replacedBy, data.createdAt, data.revokedAt);
  }

  classifyUse(now: Date, graceSeconds: number): RefreshTokenUse {
    if (this.revokedAt === null) return 'CURRENT';

    // Sin sucesor, el token se revocó por cierre de sesión o robo: no hay margen.
    const withinGrace = now.getTime() - this.revokedAt.getTime() <= graceSeconds * 1000;
    return this.replacedBy !== null && withinGrace ? 'ROTATED_WITHIN_GRACE' : 'REUSED';
  }

  getId(): string {
    return this.id;
  }
  getTokenHash(): string {
    return this.tokenHash;
  }
  getSessionId(): string {
    return this.sessionId;
  }
  getReplacedBy(): string | null {
    return this.replacedBy;
  }
  getCreatedAt(): Date {
    return this.createdAt;
  }
  getRevokedAt(): Date | null {
    return this.revokedAt;
  }
}
