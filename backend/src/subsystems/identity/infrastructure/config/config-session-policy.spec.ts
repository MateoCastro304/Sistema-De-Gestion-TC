import { ConfigSessionPolicy } from './config-session-policy';

describe('ConfigSessionPolicy', () => {
  it('defaults to 30 min of inactivity, 7 days of lifetime, 30 s of grace and a write every 60 s', () => {
    const policy = ConfigSessionPolicy.fromEnv(() => undefined);

    expect(policy.inactivitySeconds).toBe(1800);
    expect(policy.maxLifetimeSeconds).toBe(604800);
    expect(policy.refreshGraceSeconds).toBe(30);
    expect(policy.activityWriteIntervalSeconds).toBe(60);
  });

  it('reads the inactivity and the maximum lifetime from the environment', () => {
    const env: Record<string, string> = { SESSION_INACTIVITY_TTL: '10m', JWT_REFRESH_EXPIRATION: '1d' };

    const policy = ConfigSessionPolicy.fromEnv((key) => env[key]);

    expect(policy.inactivitySeconds).toBe(600);
    expect(policy.maxLifetimeSeconds).toBe(86400);
  });
});
