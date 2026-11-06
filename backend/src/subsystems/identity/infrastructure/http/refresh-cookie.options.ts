import { CookieOptions } from 'express';

type EnvReader = (key: string) => string | undefined;
type SameSite = 'strict' | 'lax' | 'none';

/**
 * Atributos de la cookie `refresh_token` (contrato §3.1): `HttpOnly` para que
 * ningún script la lea, `Secure`, `SameSite=Strict` y `Path=/api/auth`, así solo
 * viaja a los endpoints de sesión.
 *
 * Al borrarla hay que repetir `path`, `sameSite` y `secure` tal como se
 * emitió: si no coinciden, el navegador no la borra y el logout falla en
 * silencio.
 */
export class RefreshCookieOptions {
  private constructor(
    readonly name: string,
    private readonly path: string,
    private readonly sameSite: SameSite,
    private readonly secure: boolean,
  ) {}

  static fromEnv(read: EnvReader): RefreshCookieOptions {
    return new RefreshCookieOptions(
      read('COOKIE_REFRESH_NAME') ?? 'refresh_token',
      read('COOKIE_REFRESH_PATH') ?? '/api/auth',
      (read('COOKIE_REFRESH_SAMESITE') ?? 'Strict').toLowerCase() as SameSite,
      (read('COOKIE_SECURE') ?? 'true') === 'true',
    );
  }

  /** Opciones para emitir la cookie; vence cuando vence la sesión. */
  forSet(expiresAt: Date): CookieOptions {
    return { httpOnly: true, secure: this.secure, sameSite: this.sameSite, path: this.path, expires: expiresAt };
  }

  /** Opciones para borrarla. */
  forClear(): CookieOptions {
    return { httpOnly: true, secure: this.secure, sameSite: this.sameSite, path: this.path };
  }
}
