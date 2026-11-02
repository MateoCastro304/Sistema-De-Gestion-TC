import 'reflect-metadata';
import { validate } from './env.validation';

const baseEnv = {
  NODE_ENV: 'test',
  PORT: '3000',
  DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
  JWT_SECRET: 'a'.repeat(32),
  JWT_REFRESH_SECRET: 'b'.repeat(32),
};

describe('validate (auth variables)', () => {
  it('accepts the base environment without any auth variable (all have defaults)', () => {
    expect(() => validate(baseEnv)).not.toThrow();
  });

  it('accepts a full, valid auth configuration', () => {
    expect(() =>
      validate({
        ...baseEnv,
        SESSION_INACTIVITY_TTL: '30m',
        BCRYPT_COST: '12',
        COOKIE_REFRESH_NAME: 'refresh_token',
        COOKIE_REFRESH_PATH: '/api/auth',
        COOKIE_REFRESH_SAMESITE: 'Strict',
        COOKIE_SECURE: 'true',
        TRUST_PROXY: 'true',
        LOGIN_LOCK_THRESHOLD: '5',
        LOGIN_LOCK_WINDOW: '15m',
        LOGIN_LOCK_LADDER: '1m,5m,15m,1h',
        LOGIN_LOCK_USER_THRESHOLD: '25',
        LOGIN_LOCK_USER_WINDOW: '1h',
        LOGIN_LOCK_USER_LADDER: '15m',
      }),
    ).not.toThrow();
  });

  it.each([
    ['SESSION_INACTIVITY_TTL', 'soon'],
    ['BCRYPT_COST', '3'],
    ['BCRYPT_COST', '16'],
    ['BCRYPT_COST', 'high'],
    ['COOKIE_REFRESH_PATH', 'api/auth'],
    ['COOKIE_REFRESH_SAMESITE', 'sometimes'],
    ['COOKIE_SECURE', 'yes'],
    ['TRUST_PROXY', '1'],
    ['LOGIN_LOCK_THRESHOLD', '0'],
    ['LOGIN_LOCK_WINDOW', 'long'],
    ['LOGIN_LOCK_LADDER', '1m,,5m'],
    ['LOGIN_LOCK_LADDER', ''],
    ['LOGIN_LOCK_USER_THRESHOLD', 'many'],
    ['LOGIN_LOCK_USER_WINDOW', '1 hour'],
    ['LOGIN_LOCK_USER_LADDER', 'forever'],
  ])('rejects %s=%p and names the variable in the error', (name, value) => {
    expect(() => validate({ ...baseEnv, [name]: value })).toThrow(new RegExp(name));
  });

  it('rejects SameSite=None without Secure, which browsers discard', () => {
    expect(() =>
      validate({ ...baseEnv, COOKIE_REFRESH_SAMESITE: 'None', COOKIE_SECURE: 'false' }),
    ).toThrow(/COOKIE_SECURE/);
  });

  it('keeps rejecting an environment where the two JWT secrets match', () => {
    expect(() => validate({ ...baseEnv, JWT_REFRESH_SECRET: baseEnv.JWT_SECRET })).toThrow(
      /JWT_REFRESH_SECRET/,
    );
  });
});
