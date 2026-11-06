import { RefreshToken } from './refresh-token.entity';

const ROTATED_AT = new Date('2026-11-02T10:00:00.000Z');
const GRACE_SECONDS = 30;

function at(secondsFromRotation: number): Date {
  return new Date(ROTATED_AT.getTime() + secondsFromRotation * 1000);
}

function aToken(overrides: Partial<Parameters<typeof RefreshToken.reconstruct>[0]> = {}): RefreshToken {
  return RefreshToken.reconstruct({
    id: 'a1b2c3d4-0000-4000-8000-000000000001',
    tokenHash: 'f'.repeat(64),
    sessionId: '7f0e3c5e-0f55-4d84-9a39-6d3f3f0b1c11',
    replacedBy: null,
    createdAt: new Date('2026-11-02T09:00:00.000Z'),
    revokedAt: null,
    ...overrides,
  });
}

describe('RefreshToken.classifyUse', () => {
  it('is CURRENT while it was never rotated or revoked', () => {
    expect(aToken().classifyUse(at(5), GRACE_SECONDS)).toBe('CURRENT');
  });

  it('tolerates a rotated token inside the grace margin (two tabs renewing at once)', () => {
    const rotated = aToken({ replacedBy: 'a1b2c3d4-0000-4000-8000-000000000002', revokedAt: ROTATED_AT });

    expect(rotated.classifyUse(at(GRACE_SECONDS), GRACE_SECONDS)).toBe('ROTATED_WITHIN_GRACE');
  });

  it('treats a rotated token presented after the grace margin as REUSED (stolen)', () => {
    const rotated = aToken({ replacedBy: 'a1b2c3d4-0000-4000-8000-000000000002', revokedAt: ROTATED_AT });

    expect(rotated.classifyUse(at(GRACE_SECONDS + 1), GRACE_SECONDS)).toBe('REUSED');
  });

  it('treats a revoked token with no successor as REUSED, even right after the revocation', () => {
    // Sin sucesor la sesión se cerró (logout, robo): no hay margen de tolerancia.
    const revoked = aToken({ replacedBy: null, revokedAt: ROTATED_AT });

    expect(revoked.classifyUse(at(1), GRACE_SECONDS)).toBe('REUSED');
  });
});
