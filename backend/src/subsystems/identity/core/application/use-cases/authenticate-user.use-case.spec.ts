import { InMemoryLoginThrottle } from '../../../infrastructure/persistence/in-memory/in-memory-login-throttle';
import { InMemorySessionRepository } from '../../../infrastructure/persistence/in-memory/in-memory-session.repository';
import { InMemoryUserAuthRepository } from '../../../infrastructure/persistence/in-memory/in-memory-user-auth.repository';
import { InvalidCredentials } from '../../domain/errors/invalid-credentials.error';
import { UserBlocked } from '../../domain/errors/user-blocked.error';
import { LoginLockTier } from '../../domain/login-lock-policy';
import { hashRefreshToken } from '../../domain/refresh-token-secret';
import { AuthenticateUser } from './authenticate-user.use-case';
import {
  FakePasswordHasher,
  FakeSessionPolicy,
  FakeTokenIssuer,
  FixedClock,
  T0,
  anAuthUser,
} from './test-support/identity-fakes';

const TIERS: LoginLockTier[] = [
  { scope: 'username+ip', threshold: 3, windowSeconds: 900, ladderSeconds: [60] },
  { scope: 'username', threshold: 100, windowSeconds: 3600, ladderSeconds: [60] },
];

const IP = '10.0.0.1';

describe('AuthenticateUser', () => {
  let users: InMemoryUserAuthRepository;
  let sessions: InMemorySessionRepository;
  let hasher: FakePasswordHasher;
  let clock: FixedClock;
  let throttle: InMemoryLoginThrottle;
  let authenticate: AuthenticateUser;

  beforeEach(() => {
    users = new InMemoryUserAuthRepository();
    sessions = new InMemorySessionRepository();
    hasher = new FakePasswordHasher();
    clock = new FixedClock();
    throttle = new InMemoryLoginThrottle(TIERS, clock);
    authenticate = new AuthenticateUser(
      users,
      sessions,
      hasher,
      new FakeTokenIssuer(),
      throttle,
      new FakeSessionPolicy(),
      clock,
    );
    users.add(anAuthUser());
  });

  const login = (username: string, password: string, ip = IP) => authenticate.execute({ username, password, ip });

  describe('with the right credentials', () => {
    it('opens a session and returns the access token, the refresh token and the user of the contract', async () => {
      const result = await login('dcastro', 'Castro1977');

      const [session] = sessions.openedSessions();
      expect(result.accessToken).toBe(`access:1:${session.getId()}`);
      expect(result.expiresIn).toBe(900);
      expect(result.inactivityTimeoutSeconds).toBe(1800);
      expect(result.sessionExpiresAt).toEqual(new Date(T0.getTime() + 7 * 24 * 3600 * 1000));
      expect(result.user).toEqual({
        id: 1,
        username: 'dcastro',
        employee: { id: 10, firstName: 'Diego', lastName: 'Castro' },
        roles: ['AS'],
        status: 'ACTIVE',
        lastAccessAt: T0,
        createdAt: new Date('2026-03-12T12:00:00.000Z'),
      });
    });

    it('stores only the hash of the refresh token, never the token', async () => {
      const result = await login('dcastro', 'Castro1977');

      const stored = await sessions.findRefreshTokenByHash(hashRefreshToken(result.refreshToken));
      expect(stored?.getSessionId()).toBe(sessions.openedSessions()[0].getId());
      expect(await sessions.findRefreshTokenByHash(result.refreshToken)).toBeNull();
    });

    it('matches the username without caring about case or surrounding spaces', async () => {
      await expect(login('  DCastro ', 'Castro1977')).resolves.toMatchObject({ user: { username: 'dcastro' } });
    });

    it('opens a new session on every login, so one user can be in several computers', async () => {
      await login('dcastro', 'Castro1977');
      await login('dcastro', 'Castro1977');

      expect(sessions.openedSessions()).toHaveLength(2);
    });

    it('clears the failed attempts, so earlier mistakes are not held against the user', async () => {
      await expect(login('dcastro', 'mal')).rejects.toBeInstanceOf(InvalidCredentials);
      await expect(login('dcastro', 'mal')).rejects.toBeInstanceOf(InvalidCredentials);
      await login('dcastro', 'Castro1977');

      expect(throttle.failuresOf({ username: 'dcastro', ip: IP })).toBe(0);
    });
  });

  describe('with wrong credentials', () => {
    it('rejects a wrong password with the generic error and no session', async () => {
      await expect(login('dcastro', 'mal')).rejects.toBeInstanceOf(InvalidCredentials);

      expect(sessions.openedSessions()).toHaveLength(0);
    });

    it('rejects an unknown username with the same error', async () => {
      await expect(login('nadie', 'Castro1977')).rejects.toBeInstanceOf(InvalidCredentials);
    });

    it('rejects a deactivated user with the same error and no session, even with the right password', async () => {
      users.add(anAuthUser({ id: 2, username: 'baja', active: false }));

      await expect(login('baja', 'Castro1977')).rejects.toBeInstanceOf(InvalidCredentials);
      expect(sessions.openedSessions()).toHaveLength(0);
    });

    it('still verifies a hash when the username does not exist, so the response time does not reveal it', async () => {
      await expect(login('nadie', 'Castro1977')).rejects.toBeInstanceOf(InvalidCredentials);

      expect(hasher.verifications).toHaveLength(1);
    });

    it('verifies against a hash made by the configured hasher, so the cost always matches the real users', async () => {
      // Un hash fijo tendría un costo que puede no ser el de BCRYPT_COST: la demora
      // de un usuario inexistente sería distinta de la de uno real y lo delataría.
      await expect(login('nadie', 'Castro1977')).rejects.toBeInstanceOf(InvalidCredentials);

      expect(hasher.verifications[0].hash).toMatch(/^hashed:/);
    });

    it('makes that hash once and reuses it, instead of paying a hash on every unknown username', async () => {
      const hashSpy = jest.spyOn(hasher, 'hash');

      await login('nadie', 'x').catch(() => undefined);
      await login('tampoco', 'x').catch(() => undefined);

      expect(hashSpy).toHaveBeenCalledTimes(1);
    });

    it('counts the failure for a wrong password, an unknown username and a deactivated user alike', async () => {
      users.add(anAuthUser({ id: 2, username: 'baja', active: false }));

      await expect(login('dcastro', 'mal')).rejects.toBeInstanceOf(InvalidCredentials);
      await expect(login('nadie', 'x')).rejects.toBeInstanceOf(InvalidCredentials);
      await expect(login('baja', 'Castro1977')).rejects.toBeInstanceOf(InvalidCredentials);

      expect(throttle.failuresOf({ username: 'dcastro', ip: IP })).toBe(1);
      expect(throttle.failuresOf({ username: 'nadie', ip: IP })).toBe(1);
      expect(throttle.failuresOf({ username: 'baja', ip: IP })).toBe(1);
    });
  });

  describe('lockout', () => {
    it('answers UserBlocked with the wait on the attempt that reaches the threshold', async () => {
      await expect(login('dcastro', 'mal')).rejects.toBeInstanceOf(InvalidCredentials);
      await expect(login('dcastro', 'mal')).rejects.toBeInstanceOf(InvalidCredentials);

      await expect(login('dcastro', 'mal')).rejects.toMatchObject({ code: 'USER_BLOCKED', retryAfterSeconds: 60 });
    });

    it('rejects while locked even with the right password, without verifying it and without counting more', async () => {
      for (let i = 0; i < 3; i += 1) await login('dcastro', 'mal').catch(() => undefined);
      const verificationsBefore = hasher.verifications.length;

      await expect(login('dcastro', 'Castro1977')).rejects.toBeInstanceOf(UserBlocked);

      expect(hasher.verifications).toHaveLength(verificationsBefore);
      expect(throttle.failuresOf({ username: 'dcastro', ip: IP })).toBe(3);
      expect(sessions.openedSessions()).toHaveLength(0);
    });

    it('lets the user in again once the wait is over', async () => {
      for (let i = 0; i < 3; i += 1) await login('dcastro', 'mal').catch(() => undefined);

      clock.advanceSeconds(61);

      await expect(login('dcastro', 'Castro1977')).resolves.toMatchObject({ user: { username: 'dcastro' } });
    });

    it('does not lock the same username when it is tried from another IP', async () => {
      for (let i = 0; i < 3; i += 1) await login('dcastro', 'mal').catch(() => undefined);

      await expect(login('dcastro', 'Castro1977', '10.0.0.2')).resolves.toBeDefined();
    });
  });
});
