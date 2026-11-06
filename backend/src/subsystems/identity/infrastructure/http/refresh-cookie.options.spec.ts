import { RefreshCookieOptions } from './refresh-cookie.options';

const none = () => undefined;

describe('RefreshCookieOptions', () => {
  it('defaults to the cookie of the contract: HttpOnly, Secure, SameSite=Strict, Path=/api/auth', () => {
    const options = RefreshCookieOptions.fromEnv(none);
    const expiresAt = new Date('2026-11-09T10:00:00.000Z');

    expect(options.name).toBe('refresh_token');
    expect(options.forSet(expiresAt)).toEqual({
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/api/auth',
      expires: expiresAt,
    });
  });

  it('reads the name, path, SameSite and Secure from the environment', () => {
    const env: Record<string, string> = {
      COOKIE_REFRESH_NAME: 'rt',
      COOKIE_REFRESH_PATH: '/auth',
      COOKIE_REFRESH_SAMESITE: 'Lax',
      COOKIE_SECURE: 'false',
    };

    const options = RefreshCookieOptions.fromEnv((key) => env[key]);

    expect(options.name).toBe('rt');
    expect(options.forSet(new Date())).toMatchObject({ path: '/auth', sameSite: 'lax', secure: false });
  });

  it('clears with the same path, SameSite and Secure it was set with', () => {
    // Si no coinciden, el navegador no borra la cookie y el logout falla en silencio.
    const options = RefreshCookieOptions.fromEnv(none);

    const set = options.forSet(new Date());
    const clear = options.forClear();

    expect(clear).toMatchObject({ path: set.path, sameSite: set.sameSite, secure: set.secure, httpOnly: true });
  });
});
