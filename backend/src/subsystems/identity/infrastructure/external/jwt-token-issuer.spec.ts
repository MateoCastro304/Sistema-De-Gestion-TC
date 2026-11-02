import { JwtService } from '@nestjs/jwt';
import { AccessTokenExpired } from '../../core/domain/errors/access-token-expired.error';
import { Unauthenticated } from '../../core/domain/errors/unauthenticated.error';
import { JwtTokenIssuer } from './jwt-token-issuer';

const SECRET = 'test-only-secret-that-is-long-enough-123456';
const SID = '7f0e3c5e-0f55-4d84-9a39-6d3f3f0b1c11';

const jwt = new JwtService({ secret: SECRET });
const issuer = new JwtTokenIssuer(jwt, 900);

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

describe('JwtTokenIssuer', () => {
  it('issues a token that verifies back into the same claims', () => {
    const { token } = issuer.issue({ sub: 42, sid: SID });

    expect(issuer.verify(token)).toEqual({ sub: 42, sid: SID });
  });

  it('reports the lifetime in seconds', () => {
    expect(issuer.issue({ sub: 1, sid: SID }).expiresIn).toBe(900);
  });

  it('puts the lifetime in the token itself', () => {
    const { token } = issuer.issue({ sub: 1, sid: SID });
    const { iat, exp } = jwt.decode<{ iat: number; exp: number }>(token);

    expect(exp - iat).toBe(900);
  });

  it('throws AccessTokenExpired for a valid token that already expired', () => {
    const expired = jwt.sign({ sub: '1', sid: SID, exp: nowSeconds() - 10 });

    expect(() => issuer.verify(expired)).toThrow(AccessTokenExpired);
  });

  it.each([
    ['garbage', 'not.a.jwt'],
    ['an empty string', ''],
  ])('throws Unauthenticated for %s', (_label, token) => {
    expect(() => issuer.verify(token)).toThrow(Unauthenticated);
  });

  it('throws Unauthenticated for a token signed with another secret', () => {
    const forged = new JwtService({ secret: 'another-secret-that-is-also-long-enough-99' }).sign({
      sub: '1',
      sid: SID,
    });

    expect(() => issuer.verify(forged)).toThrow(Unauthenticated);
  });

  it('throws Unauthenticated for an unsigned token (alg none)', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'none', typ: 'JWT' })).toString('base64url');
    const payload = Buffer.from(JSON.stringify({ sub: '1', sid: SID, exp: nowSeconds() + 900 })).toString('base64url');

    expect(() => issuer.verify(`${header}.${payload}.`)).toThrow(Unauthenticated);
  });

  it('throws Unauthenticated for a token signed with another algorithm', () => {
    const hs512 = new JwtService({ secret: SECRET, signOptions: { algorithm: 'HS512' } }).sign({ sub: '1', sid: SID });

    expect(() => issuer.verify(hs512)).toThrow(Unauthenticated);
  });

  it.each([
    ['without sid', { sub: '1' }],
    ['without sub', { sid: SID }],
    ['with a non numeric sub', { sub: 'abc', sid: SID }],
    ['with a non string sid', { sub: '1', sid: 7 }],
  ])('throws Unauthenticated for a valid signature but claims %s', (_label, claims) => {
    expect(() => issuer.verify(jwt.sign(claims, { expiresIn: 900 }))).toThrow(Unauthenticated);
  });
});
