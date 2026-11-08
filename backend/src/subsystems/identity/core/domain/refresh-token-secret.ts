import { createHash, randomBytes } from 'node:crypto';

/** Un refresh token recién generado: el valor en claro (va a la cookie) y su hash (se guarda). */
export type GeneratedRefreshToken = { token: string; hash: string };

/**
 * SHA-256 en hexadecimal. El token es aleatorio y de alta entropía: no necesita
 * sal ni un hash lento como bcrypt, y un hash determinístico permite buscarlo
 * por índice.
 */
export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** 32 bytes aleatorios en base64url: opaco para el cliente y sin caracteres problemáticos en una cookie. */
export function generateRefreshToken(): GeneratedRefreshToken {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashRefreshToken(token) };
}
