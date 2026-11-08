import { InMemoryLoginThrottle } from '../../../infrastructure/persistence/in-memory/in-memory-login-throttle';
import { InMemorySessionRepository } from '../../../infrastructure/persistence/in-memory/in-memory-session.repository';
import { InMemoryUserAuthRepository } from '../../../infrastructure/persistence/in-memory/in-memory-user-auth.repository';
import { Unauthenticated } from '../../domain/errors/unauthenticated.error';
import { SessionExpired } from '../../domain/errors/session-expired.error';
import { hashRefreshToken } from '../../domain/refresh-token-secret';
import { AuthenticateUser } from './authenticate-user.use-case';
import { RefreshSession } from './refresh-session.use-case';
import { FakePasswordHasher, FakeSessionPolicy, FakeTokenIssuer, FixedClock, anAuthUser } from './test-support/identity-fakes';

const IP = '10.0.0.1';
const MINUTE = 60;
const DAY = 24 * 3600;

describe('RefreshSession', () => {
  let users: InMemoryUserAuthRepository;
  let sessions: InMemorySessionRepository;
  let clock: FixedClock;
  let refresh: RefreshSession;
  let firstToken: string;

  beforeEach(async () => {
    users = new InMemoryUserAuthRepository();
    sessions = new InMemorySessionRepository();
    clock = new FixedClock();
    const policy = new FakeSessionPolicy();
    const tokens = new FakeTokenIssuer();
    users.add(anAuthUser());

    const authenticate = new AuthenticateUser(
      users,
      sessions,
      new FakePasswordHasher(),
      tokens,
      new InMemoryLoginThrottle([], clock),
      policy,
      clock,
    );
    refresh = new RefreshSession(users, sessions, tokens, policy, clock);

    firstToken = (await authenticate.execute({ username: 'dcastro', password: 'Castro1977', ip: IP })).refreshToken;
  });

  const sessionOf = () => sessions.openedSessions()[0];

  describe('with a valid refresh token', () => {
    it('returns a new access token and a new refresh token, with the current user', async () => {
      clock.advanceSeconds(10 * MINUTE);

      const result = await refresh.execute({ refreshToken: firstToken });

      expect(result.accessToken).toBe(`access:1:${sessionOf().getId()}`);
      expect(result.refreshToken).not.toBe(firstToken);
      expect(result.user).toMatchObject({ id: 1, username: 'dcastro', roles: ['AS'], status: 'ACTIVE' });
    });

    it('rotates the token: the old one is revoked and points to its replacement, and only the new one is live', async () => {
      const result = await refresh.execute({ refreshToken: firstToken });

      const old = await sessions.findRefreshTokenByHash(hashRefreshToken(firstToken));
      const next = await sessions.findRefreshTokenByHash(hashRefreshToken(result.refreshToken));
      expect(old?.getRevokedAt()).not.toBeNull();
      expect(old?.getReplacedBy()).toBe(next?.getId());
      expect((await sessions.findLiveRefreshToken(sessionOf().getId()))?.getId()).toBe(next?.getId());
    });

    it('does not extend the session: it still ends 7 days after the login (D-44)', async () => {
      const loginExpiry = sessionOf().getExpiresAt();
      clock.advanceSeconds(2 * DAY);
      // El usuario estuvo activo: si no, la inactividad cortaría la sesión antes.
      await sessions.touchActivity(sessionOf().getId(), clock.now());

      const result = await refresh.execute({ refreshToken: firstToken });

      expect(result.sessionExpiresAt).toEqual(loginExpiry);
      expect(sessionOf().getExpiresAt()).toEqual(loginExpiry);
    });

    it('does not count as activity (D-46)', async () => {
      const lastActivity = sessionOf().getLastActivityAt();
      clock.advanceSeconds(10 * MINUTE);

      await refresh.execute({ refreshToken: firstToken });

      expect(sessionOf().getLastActivityAt()).toEqual(lastActivity);
    });

    it('reflects the roles the user has now, not the ones from the login', async () => {
      users.add(anAuthUser({ roles: ['EC', 'AT'], permissions: ['supplier:manage'] }));

      const result = await refresh.execute({ refreshToken: firstToken });

      expect(result.user.roles).toEqual(['EC', 'AT']);
    });
  });

  describe('rotated token reuse (D-47)', () => {
    it('tolerates the previous token inside the 30 seconds margin, so two tabs can renew at once', async () => {
      await refresh.execute({ refreshToken: firstToken });
      clock.advanceSeconds(10);

      const second = await refresh.execute({ refreshToken: firstToken });

      expect(second.refreshToken).not.toBe(firstToken);
      expect(sessionOf().getEndedAt()).toBeNull();
    });

    it('keeps a single live token after a tolerated reuse', async () => {
      await refresh.execute({ refreshToken: firstToken });
      clock.advanceSeconds(10);
      const second = await refresh.execute({ refreshToken: firstToken });

      const live = await sessions.findLiveRefreshToken(sessionOf().getId());
      expect(live?.getTokenHash()).toBe(hashRefreshToken(second.refreshToken));
    });

    it('treats the previous token as stolen after the margin: closes the whole session as REVOKED', async () => {
      const rotated = await refresh.execute({ refreshToken: firstToken });
      clock.advanceSeconds(31);

      await expect(refresh.execute({ refreshToken: firstToken })).rejects.toBeInstanceOf(Unauthenticated);

      expect(sessionOf().getEndReason()).toBe('REVOKED');
      // El token nuevo tampoco sirve: quien lo tenga queda afuera.
      await expect(refresh.execute({ refreshToken: rotated.refreshToken })).rejects.toBeInstanceOf(Unauthenticated);
    });
  });

  describe('when it cannot be used', () => {
    it.each([
      ['missing', undefined],
      ['empty', ''],
      ['unknown', 'a-token-nobody-issued'],
    ])('rejects a refresh token that is %s with UNAUTHENTICATED', async (_label, token) => {
      await expect(refresh.execute({ refreshToken: token })).rejects.toBeInstanceOf(Unauthenticated);
    });

    it('rejects a token of a session that was closed (after logout), whatever the reason', async () => {
      await sessions.end(sessionOf().getId(), 'MANUAL', clock.now());

      await expect(refresh.execute({ refreshToken: firstToken })).rejects.toBeInstanceOf(Unauthenticated);
      expect(sessionOf().getEndReason()).toBe('MANUAL');
    });

    it('closes the session as INACTIVITY after 30 minutes without activity', async () => {
      clock.advanceSeconds(30 * MINUTE);

      await expect(refresh.execute({ refreshToken: firstToken })).rejects.toMatchObject({
        code: 'SESSION_EXPIRED',
        reason: 'INACTIVITY',
      });
      expect(sessionOf().getEndReason()).toBe('INACTIVITY');
    });

    it('refreshing is not activity, so it cannot keep an idle session alive', async () => {
      clock.advanceSeconds(20 * MINUTE);
      const renewed = await refresh.execute({ refreshToken: firstToken });
      clock.advanceSeconds(11 * MINUTE);

      await expect(refresh.execute({ refreshToken: renewed.refreshToken })).rejects.toBeInstanceOf(SessionExpired);
    });

    it('closes the session as EXPIRED after 7 days, however much it was used', async () => {
      // Con actividad reciente: solo el límite de duración la corta.
      await sessions.touchActivity(sessionOf().getId(), new Date(clock.now().getTime() + 7 * DAY * 1000 - 1000));
      clock.advanceSeconds(7 * DAY);

      await expect(refresh.execute({ refreshToken: firstToken })).rejects.toMatchObject({
        code: 'SESSION_EXPIRED',
        reason: 'EXPIRED',
      });
      expect(sessionOf().getEndReason()).toBe('EXPIRED');
    });

    it('closes the session as REVOKED when the user was deactivated', async () => {
      users.add(anAuthUser({ active: false }));

      await expect(refresh.execute({ refreshToken: firstToken })).rejects.toBeInstanceOf(Unauthenticated);

      expect(sessionOf().getEndReason()).toBe('REVOKED');
    });
  });
});
