import { ClockPort } from '../../../../../shared/clock/clock.port';
import {
  LoginAttemptRecord,
  LoginLockTier,
  applyFailure,
  remainingLockSeconds,
} from '../../../core/domain/login-lock-policy';
import { loginAttemptKey } from '../../../core/domain/login-attempt-key';
import { LoginAttemptContext, LoginThrottle } from '../../../core/domain/ports/login-throttle.port';

/**
 * Throttle en memoria para los tests unitarios. Usa la política real, así los
 * tests de los casos de uso ejercen la misma escala que producción.
 */
export class InMemoryLoginThrottle extends LoginThrottle {
  private readonly records = new Map<string, LoginAttemptRecord>();

  constructor(
    private readonly tiers: readonly LoginLockTier[],
    private readonly clock: ClockPort,
  ) {
    super();
  }

  remainingLockSeconds(context: LoginAttemptContext): Promise<number> {
    const now = this.clock.now();
    const waits = this.tiers.map((tier) =>
      remainingLockSeconds(this.records.get(InMemoryLoginThrottle.keyOf(tier, context)) ?? null, now),
    );
    return Promise.resolve(Math.max(0, ...waits));
  }

  recordFailure(context: LoginAttemptContext): Promise<number> {
    const now = this.clock.now();
    const waits = this.tiers.map((tier) => {
      const key = InMemoryLoginThrottle.keyOf(tier, context);
      const next = applyFailure(tier, this.records.get(key) ?? null, now);
      this.records.set(key, next);
      return remainingLockSeconds(next, now);
    });
    return Promise.resolve(Math.max(0, ...waits));
  }

  recordSuccess(context: LoginAttemptContext): Promise<void> {
    this.tiers.forEach((tier) => this.records.delete(InMemoryLoginThrottle.keyOf(tier, context)));
    return Promise.resolve();
  }

  /** Para los asserts de los tests: cuántos fallos seguidos lleva el nivel usuario+IP. */
  failuresOf(context: LoginAttemptContext): number {
    return this.records.get(loginAttemptKey('username+ip', context))?.failures ?? 0;
  }

  private static keyOf(tier: LoginLockTier, context: LoginAttemptContext): string {
    return loginAttemptKey(tier.scope, context);
  }
}
