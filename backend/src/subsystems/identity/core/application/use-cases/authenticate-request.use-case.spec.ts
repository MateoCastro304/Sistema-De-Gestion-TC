import { InMemoryLoginThrottle } from '../../../infrastructure/persistence/in-memory/in-memory-login-throttle';
import { InMemorySessionRepository } from '../../../infrastructure/persistence/in-memory/in-memory-session.repository';
import { InMemoryUserAuthRepository } from '../../../infrastructure/persistence/in-memory/in-memory-user-auth.repository';
import { AccessTokenExpired } from '../../domain/errors/access-token-expired.error';
import { Unauthenticated } from '../../domain/errors/unauthenticated.error';
import { AuthenticateRequest } from './authenticate-request.use-case';
import { AuthenticateUser } from './authenticate-user.use-case';
import { FakePasswordHasher, FakeSessionPolicy, FakeTokenIssuer, FixedClock, anAuthUser } from './test-support/identity-fakes';

const MINUTE = 60;
const DAY = 24 * 3600;

describe('AuthenticateRequest', () => {
  let users: InMemoryUserAuthRepository;
  let sessions: InMemorySessionRepository;
  let clock: FixedClock;
  let authenticateRequest: AuthenticateRequest;
  let accessToken: string;

  beforeEach(async () => {
    users = new InMemoryUserAuthRepository();
    sessions = new InMemorySessionRepository();
    clock = new FixedClock();
    const policy = new FakeSessionPolicy();
    const tokens = new FakeTokenIssuer();
    users.add(anAuthUser({ roles: ['EC', 'AT'], permissions: ['supplier:manage', 'process-type:manage'] }));

    const login = new AuthenticateUser(
      users,
      sessions,
      new FakePasswordHasher(),
      tokens,
      new InMemoryLoginThrottle([], clock),
      policy,
      clock,
    );
    authenticateRequest = new AuthenticateRequest(users, sessions, tokens, policy, clock);

    accessToken = (await login.execute({ username: 'dcastro', password: 'Castro1977', ip: '10.0.0.1' })).accessToken;
  });

  const sessionOf = () => sessions.openedSessions()[0];

  describe('with a valid token and an open session', () => {
    it('returns the user with the roles and permissions they have now', async () => {
      const user = await authenticateRequest.execute({ accessToken });

      expect(user).toEqual({
        userId: 1,
        sessionId: sessionOf().getId(),
        roles: ['EC', 'AT'],
        permissions: ['supplier:manage', 'process-type:manage'],
      });
    });

    it('reflects a change of roles right away, not the roles from the login (RNF09)', async () => {
      users.add(anAuthUser({ roles: ['ERP'], permissions: ['customer:manage'] }));

      const user = await authenticateRequest.execute({ accessToken });

      expect(user.roles).toEqual(['ERP']);
      expect(user.permissions).toEqual(['customer:manage']);
    });

    it('records the activity, but at most once per minute', async () => {
      clock.advanceSeconds(59);
      await authenticateRequest.execute({ accessToken });
      expect(sessionOf().getLastActivityAt()).toEqual(new Date('2026-11-02T10:00:00.000Z'));

      clock.advanceSeconds(1);
      await authenticateRequest.execute({ accessToken });
      expect(sessionOf().getLastActivityAt()).toEqual(clock.now());
    });

    it('keeps the session alive while it is used, even past the inactivity time since the login', async () => {
      // Una petición cada 20 minutos: nunca hay 30 sin actividad.
      for (let i = 0; i < 5; i += 1) {
        clock.advanceSeconds(20 * MINUTE);
        await expect(authenticateRequest.execute({ accessToken })).resolves.toBeDefined();
      }
    });
  });

  describe('when the token is not usable', () => {
    it.each([
      ['missing', undefined],
      ['empty', ''],
      ['garbage', 'not-a-token'],
    ])('rejects a token that is %s with UNAUTHENTICATED', async (_label, token) => {
      await expect(authenticateRequest.execute({ accessToken: token })).rejects.toBeInstanceOf(Unauthenticated);
    });

    it('propagates ACCESS_TOKEN_EXPIRED so the client renews with the refresh token', async () => {
      const tokens = new FakeTokenIssuer();
      jest.spyOn(tokens, 'verify').mockImplementation(() => {
        throw new AccessTokenExpired();
      });
      const withExpiredToken = new AuthenticateRequest(users, sessions, tokens, new FakeSessionPolicy(), clock);

      await expect(withExpiredToken.execute({ accessToken })).rejects.toBeInstanceOf(AccessTokenExpired);
    });

    it('rejects a token whose session does not exist', async () => {
      await expect(authenticateRequest.execute({ accessToken: 'access:1:no-such-session' })).rejects.toBeInstanceOf(
        Unauthenticated,
      );
    });

    it('rejects a token of one user that points to the session of another', async () => {
      // El sid es de una sesión del usuario 1, pero el sub dice usuario 2.
      await expect(
        authenticateRequest.execute({ accessToken: `access:2:${sessionOf().getId()}` }),
      ).rejects.toBeInstanceOf(Unauthenticated);
    });
  });

  describe('when the session is not usable', () => {
    it('rejects the token of a closed session even though it has not expired (D-04)', async () => {
      await sessions.end(sessionOf().getId(), 'MANUAL', clock.now());

      await expect(authenticateRequest.execute({ accessToken })).rejects.toBeInstanceOf(Unauthenticated);
    });

    it('closes the session as INACTIVITY after 30 minutes without activity', async () => {
      clock.advanceSeconds(30 * MINUTE);

      await expect(authenticateRequest.execute({ accessToken })).rejects.toMatchObject({
        code: 'SESSION_EXPIRED',
        reason: 'INACTIVITY',
      });
      expect(sessionOf().getEndReason()).toBe('INACTIVITY');
    });

    it('closes the session as EXPIRED after 7 days, however active it was', async () => {
      await sessions.touchActivity(sessionOf().getId(), new Date(clock.now().getTime() + 7 * DAY * 1000 - 1000));
      clock.advanceSeconds(7 * DAY);

      await expect(authenticateRequest.execute({ accessToken })).rejects.toMatchObject({
        code: 'SESSION_EXPIRED',
        reason: 'EXPIRED',
      });
      expect(sessionOf().getEndReason()).toBe('EXPIRED');
    });

    it('closes the session as REVOKED and rejects when the user was deactivated', async () => {
      users.add(anAuthUser({ active: false }));

      await expect(authenticateRequest.execute({ accessToken })).rejects.toBeInstanceOf(Unauthenticated);

      expect(sessionOf().getEndReason()).toBe('REVOKED');
    });
  });
});
