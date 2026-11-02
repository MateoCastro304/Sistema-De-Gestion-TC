import { loginLockTiers } from './login-lock-tiers';

const noEnv = () => undefined;

describe('loginLockTiers', () => {
  it('uses the recommended defaults when nothing is configured', () => {
    const [primary, backstop] = loginLockTiers(noEnv);

    expect(primary).toEqual({
      scope: 'username+ip',
      threshold: 5,
      windowSeconds: 15 * 60,
      ladderSeconds: [90, 300, 900, 1800, 3600],
    });
    expect(backstop).toEqual({
      scope: 'username',
      threshold: 25,
      windowSeconds: 60 * 60,
      ladderSeconds: [15 * 60],
    });
  });

  it('reads each tier from its own variables', () => {
    const env: Record<string, string> = {
      LOGIN_LOCK_THRESHOLD: '3',
      LOGIN_LOCK_WINDOW: '10m',
      LOGIN_LOCK_LADDER: '1m,2m',
      LOGIN_LOCK_USER_THRESHOLD: '10',
      LOGIN_LOCK_USER_WINDOW: '30m',
      LOGIN_LOCK_USER_LADDER: '5m',
    };

    const [primary, backstop] = loginLockTiers((key) => env[key]);

    expect(primary).toMatchObject({ threshold: 3, windowSeconds: 600, ladderSeconds: [60, 120] });
    expect(backstop).toMatchObject({ threshold: 10, windowSeconds: 1800, ladderSeconds: [300] });
  });

  it('fails the bootstrap naming the variable when a ladder goes above the ceiling', () => {
    const env: Record<string, string> = { LOGIN_LOCK_LADDER: '90s,2d' };

    expect(() => loginLockTiers((key) => env[key])).toThrow(/LOGIN_LOCK_LADDER/);
  });

  it('fails the bootstrap naming the variable when a ladder goes backwards', () => {
    const env: Record<string, string> = { LOGIN_LOCK_USER_LADDER: '15m,5m' };

    expect(() => loginLockTiers((key) => env[key])).toThrow(/LOGIN_LOCK_USER_LADDER/);
  });
});
