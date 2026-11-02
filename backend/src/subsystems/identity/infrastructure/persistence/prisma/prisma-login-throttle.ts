import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { ClockPort } from '../../../../../shared/clock/clock.port';
import { PrismaClientProvider } from '../../../../../shared/infrastructure/prisma/prisma-client.provider';
import {
  LoginAttemptRecord,
  LoginLockTier,
  applyFailure,
  assertUsableTier,
  remainingLockSeconds,
} from '../../../core/domain/login-lock-policy';
import { LoginAttemptContext, LoginThrottle } from '../../../core/domain/ports/login-throttle.port';

/** Reintentos de la escritura optimista antes de rendirse. Cada uno implica que otro intento ganó la carrera. */
const MAX_WRITE_ATTEMPTS = 5;

/**
 * Bloqueo de ingreso sobre la tabla `login_attempt`: una fila por clave y por
 * nivel (`u:<username>|ip:<ip>` y `u:<username>`). No tiene FK a `app_user`, así
 * que cuenta también los usernames que no existen.
 *
 * Los niveles ya vienen validados (ver `loginLockTiers`); se vuelven a chequear
 * acá para que un uso directo no pueda construir un throttle que nunca bloquea.
 */
@Injectable()
export class PrismaLoginThrottle extends LoginThrottle {
  constructor(
    private readonly clients: PrismaClientProvider,
    private readonly clock: ClockPort,
    private readonly tiers: readonly LoginLockTier[],
  ) {
    super();
    tiers.forEach((tier) => assertUsableTier(tier, tier.scope === 'username' ? 'LOGIN_LOCK_USER' : 'LOGIN_LOCK'));
  }

  async remainingLockSeconds(context: LoginAttemptContext): Promise<number> {
    const now = this.clock.now();
    const rows = await this.clients.current().loginAttempt.findMany({
      where: { identifier: { in: this.tiers.map((tier) => PrismaLoginThrottle.keyOf(tier, context)) } },
    });

    return Math.max(0, ...rows.map((row) => remainingLockSeconds(PrismaLoginThrottle.toRecord(row), now)));
  }

  async recordFailure(context: LoginAttemptContext): Promise<number> {
    const now = this.clock.now();
    const waits = await Promise.all(
      this.tiers.map((tier) => this.recordTierFailure(PrismaLoginThrottle.keyOf(tier, context), tier, now)),
    );
    return Math.max(0, ...waits);
  }

  async recordSuccess(context: LoginAttemptContext): Promise<void> {
    await this.clients.current().loginAttempt.deleteMany({
      where: { identifier: { in: this.tiers.map((tier) => PrismaLoginThrottle.keyOf(tier, context)) } },
    });
  }

  /**
   * Leer, calcular y escribir en pasos separados pierde cuentas cuando dos
   * intentos llegan a la vez: los dos leen el mismo valor y suman uno solo. La
   * escritura es optimista: solo pisa la fila si no cambió desde la lectura, y
   * si otro intento ganó la carrera, se relee y se reintenta.
   */
  private async recordTierFailure(identifier: string, tier: LoginLockTier, now: Date): Promise<number> {
    const client = this.clients.current();

    for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt += 1) {
      const row = await client.loginAttempt.findUnique({ where: { identifier } });
      const next = applyFailure(tier, row ? PrismaLoginThrottle.toRecord(row) : null, now);
      const data = {
        consecutiveFailures: next.failures,
        lastFailedAt: next.lastFailedAt,
        lockedUntil: next.lockedUntil,
      };

      if (row === null) {
        try {
          await client.loginAttempt.create({ data: { identifier, ...data } });
          return remainingLockSeconds(next, now);
        } catch (error) {
          if (!PrismaLoginThrottle.isUniqueViolation(error)) throw error;
          continue; // otro intento creó la fila primero
        }
      }

      const { count } = await client.loginAttempt.updateMany({
        where: { identifier, consecutiveFailures: row.consecutiveFailures, lastFailedAt: row.lastFailedAt },
        data,
      });
      if (count === 1) return remainingLockSeconds(next, now);
    }

    throw new Error(`No se pudo registrar el intento fallido de ${identifier}: demasiada contención.`);
  }

  private static keyOf(tier: LoginLockTier, { username, ip }: LoginAttemptContext): string {
    return tier.scope === 'username+ip' ? `u:${username}|ip:${ip}` : `u:${username}`;
  }

  private static toRecord(row: {
    consecutiveFailures: number;
    lastFailedAt: Date;
    lockedUntil: Date | null;
  }): LoginAttemptRecord {
    return { failures: row.consecutiveFailures, lastFailedAt: row.lastFailedAt, lockedUntil: row.lockedUntil };
  }

  private static isUniqueViolation(error: unknown): boolean {
    return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
  }
}
