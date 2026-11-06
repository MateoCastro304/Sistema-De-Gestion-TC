import { Session } from './session.entity';

const STARTED_AT = new Date('2026-11-02T10:00:00.000Z');
const INACTIVITY_SECONDS = 30 * 60;

function at(secondsFromStart: number): Date {
  return new Date(STARTED_AT.getTime() + secondsFromStart * 1000);
}

function aSession(overrides: Partial<Parameters<typeof Session.reconstruct>[0]> = {}): Session {
  return Session.reconstruct({
    id: '7f0e3c5e-0f55-4d84-9a39-6d3f3f0b1c11',
    userId: 1,
    startedAt: STARTED_AT,
    lastActivityAt: STARTED_AT,
    expiresAt: at(7 * 24 * 3600),
    endedAt: null,
    endReason: null,
    ...overrides,
  });
}

describe('Session.check', () => {
  it('is ACTIVE while it is open, within its lifetime and recently used', () => {
    expect(aSession().check(at(60), INACTIVITY_SECONDS)).toBe('ACTIVE');
  });

  it('is ENDED once it was closed, whatever the reason', () => {
    const session = aSession({ endedAt: at(10), endReason: 'MANUAL' });

    expect(session.check(at(20), INACTIVITY_SECONDS)).toBe('ENDED');
  });

  it('is EXPIRED from the moment it reaches its maximum lifetime', () => {
    const session = aSession({ lastActivityAt: at(7 * 24 * 3600 - 10) });

    expect(session.check(at(7 * 24 * 3600 - 1), INACTIVITY_SECONDS)).toBe('ACTIVE');
    expect(session.check(at(7 * 24 * 3600), INACTIVITY_SECONDS)).toBe('EXPIRED');
  });

  it('is INACTIVE after 30 minutes without activity, counted from the last activity', () => {
    const session = aSession({ lastActivityAt: at(100) });

    expect(session.check(at(100 + INACTIVITY_SECONDS - 1), INACTIVITY_SECONDS)).toBe('ACTIVE');
    expect(session.check(at(100 + INACTIVITY_SECONDS), INACTIVITY_SECONDS)).toBe('INACTIVE');
  });

  it('reports EXPIRED before INACTIVE when both apply, because the lifetime is the stricter reason', () => {
    const session = aSession({ expiresAt: at(100), lastActivityAt: at(0) });

    expect(session.check(at(INACTIVITY_SECONDS + 500), INACTIVITY_SECONDS)).toBe('EXPIRED');
  });
});

describe('Session.needsActivityUpdate', () => {
  it('skips the write while the last activity is more recent than the interval', () => {
    // Una escritura por request es costosa (MVCC): se escribe como mucho una vez por intervalo.
    const session = aSession({ lastActivityAt: at(0) });

    expect(session.needsActivityUpdate(at(59), 60)).toBe(false);
  });

  it('asks for the write once the interval has passed', () => {
    const session = aSession({ lastActivityAt: at(0) });

    expect(session.needsActivityUpdate(at(60), 60)).toBe(true);
  });
});
