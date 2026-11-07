import { BcryptPasswordHasher } from './bcrypt-password-hasher';

// Costo mínimo de bcrypt: estos tests prueban el contrato, no la dureza del hash.
const hasher = new BcryptPasswordHasher(4);

describe('BcryptPasswordHasher', () => {
  it('hashes a password into something that is not the password', async () => {
    const hash = await hasher.hash('Castro1977');

    expect(hash).not.toContain('Castro1977');
    expect(hash).toMatch(/^\$2[aby]\$04\$/);
  });

  it('verifies the right password and rejects a wrong one', async () => {
    const hash = await hasher.hash('Castro1977');

    expect(await hasher.verify('Castro1977', hash)).toBe(true);
    expect(await hasher.verify('castro1977', hash)).toBe(false);
  });

  it('salts every hash: the same password never produces the same hash', async () => {
    expect(await hasher.hash('Castro1977')).not.toBe(await hasher.hash('Castro1977'));
  });

  it('rejects, instead of throwing, when the stored hash is malformed', async () => {
    expect(await hasher.verify('Castro1977', 'not-a-bcrypt-hash')).toBe(false);
  });
});
