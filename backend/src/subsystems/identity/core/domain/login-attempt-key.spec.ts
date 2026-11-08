import { loginAttemptKey } from './login-attempt-key';

describe('loginAttemptKey', () => {
  it('keeps the key readable for a normal username and IP', () => {
    expect(loginAttemptKey('username+ip', { username: 'dcastro', ip: '10.0.0.1' })).toBe('u:dcastro|ip:10.0.0.1');
    expect(loginAttemptKey('username', { username: 'dcastro', ip: '10.0.0.1' })).toBe('u:dcastro');
  });

  it('is the same key for the same input and a different one for another username or IP', () => {
    const a = loginAttemptKey('username+ip', { username: 'dcastro', ip: '10.0.0.1' });

    expect(loginAttemptKey('username+ip', { username: 'dcastro', ip: '10.0.0.1' })).toBe(a);
    expect(loginAttemptKey('username+ip', { username: 'mcastro', ip: '10.0.0.1' })).not.toBe(a);
    expect(loginAttemptKey('username+ip', { username: 'dcastro', ip: '10.0.0.2' })).not.toBe(a);
  });

  it('never exceeds the 120 characters of the column, however long the username or the IP are', () => {
    const key = loginAttemptKey('username+ip', { username: 'a'.repeat(5000), ip: '1'.repeat(5000) });

    expect(key.length).toBeLessThanOrEqual(120);
  });

  it('gives different keys to different long usernames, so they do not share a counter by accident', () => {
    const one = loginAttemptKey('username', { username: 'a'.repeat(100), ip: '10.0.0.1' });
    const other = loginAttemptKey('username', { username: `${'a'.repeat(99)}b`, ip: '10.0.0.1' });

    expect(one).not.toBe(other);
  });

  it('cannot collide a long username with a real one that has the same first 30 characters', () => {
    // El truncado dejaría a cualquiera bloquear a un usuario ajeno mandando su
    // nombre más basura al final. Por eso se usa un hash, no un recorte.
    const real = loginAttemptKey('username', { username: 'a'.repeat(30), ip: '10.0.0.1' });
    const attack = loginAttemptKey('username', { username: `${'a'.repeat(30)}basura`, ip: '10.0.0.1' });

    expect(attack).not.toBe(real);
  });

  it('never puts a NUL character in the key, which PostgreSQL rejects in text', () => {
    const key = loginAttemptKey('username+ip', { username: 'abc\u0000def', ip: '10.0.0.1' });

    expect(key).not.toContain('\u0000');
  });

  it('gives a username with a NUL and the same one without it different keys', () => {
    const withNul = loginAttemptKey('username', { username: 'abc\u0000def', ip: '10.0.0.1' });
    const without = loginAttemptKey('username', { username: 'abcdef', ip: '10.0.0.1' });

    expect(withNul).not.toBe(without);
  });
});
