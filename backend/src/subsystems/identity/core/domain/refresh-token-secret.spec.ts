import { generateRefreshToken, hashRefreshToken } from './refresh-token-secret';

describe('refresh token secret', () => {
  it('generates an opaque token and the SHA-256 hash that is stored', () => {
    const { token, hash } = generateRefreshToken();

    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/); // 32 bytes aleatorios en base64url
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(hashRefreshToken(token));
  });

  it('never repeats a token', () => {
    const tokens = new Set(Array.from({ length: 50 }, () => generateRefreshToken().token));

    expect(tokens.size).toBe(50);
  });

  it('hashes deterministically, so the stored hash can be looked up by index', () => {
    expect(hashRefreshToken('abc')).toBe(hashRefreshToken('abc'));
    // Vector conocido de SHA-256("abc").
    expect(hashRefreshToken('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
