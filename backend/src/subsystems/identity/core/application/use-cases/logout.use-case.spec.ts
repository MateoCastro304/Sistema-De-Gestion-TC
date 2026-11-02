import { InMemoryLoginThrottle } from '../../../infrastructure/persistence/in-memory/in-memory-login-throttle';
import { InMemorySessionRepository } from '../../../infrastructure/persistence/in-memory/in-memory-session.repository';
import { InMemoryUserAuthRepository } from '../../../infrastructure/persistence/in-memory/in-memory-user-auth.repository';
import { Unauthenticated } from '../../domain/errors/unauthenticated.error';
import { AuthenticateUser } from './authenticate-user.use-case';
import { Logout } from './logout.use-case';
import { RefreshSession } from './refresh-session.use-case';
import { FakePasswordHasher, FakeSessionPolicy, FakeTokenIssuer, FixedClock, anAuthUser } from './test-support/identity-fakes';

describe('Logout', () => {
  let sessions: InMemorySessionRepository;
  let clock: FixedClock;
  let authenticate: AuthenticateUser;
  let refresh: RefreshSession;
  let logout: Logout;

  beforeEach(() => {
    const users = new InMemoryUserAuthRepository();
    sessions = new InMemorySessionRepository();
    clock = new FixedClock();
    const policy = new FakeSessionPolicy();
    const tokens = new FakeTokenIssuer();
    users.add(anAuthUser());

    authenticate = new AuthenticateUser(
      users,
      sessions,
      new FakePasswordHasher(),
      tokens,
      new InMemoryLoginThrottle([], clock),
      policy,
      clock,
    );
    refresh = new RefreshSession(users, sessions, tokens, policy, clock);
    logout = new Logout(sessions, tokens, clock);
  });

  const login = () => authenticate.execute({ username: 'dcastro', password: 'Castro1977', ip: '10.0.0.1' });
  const sessionAt = (index: number) => sessions.openedSessions()[index];

  it('closes the session with reason MANUAL when the refresh cookie arrives', async () => {
    const { refreshToken } = await login();
    clock.advanceSeconds(60);

    await logout.execute({ refreshToken });

    expect(sessionAt(0).getEndReason()).toBe('MANUAL');
    expect(sessionAt(0).getEndedAt()).toEqual(clock.now());
  });

  it('closes the session with the access token when there is no cookie', async () => {
    const { accessToken } = await login();

    await logout.execute({ accessToken });

    expect(sessionAt(0).getEndReason()).toBe('MANUAL');
  });

  it('closes the session even when the access token already expired', async () => {
    // FakeTokenIssuer no distingue vencidos: lo que importa es que se use verifyIgnoringExpiration.
    const { accessToken } = await login();
    const issuer = new FakeTokenIssuer();
    const verifyAnyway = jest.spyOn(issuer, 'verifyIgnoringExpiration');
    const withSpy = new Logout(sessions, issuer, clock);

    await withSpy.execute({ accessToken });

    expect(verifyAnyway).toHaveBeenCalledWith(accessToken);
    expect(sessionAt(0).getEndReason()).toBe('MANUAL');
  });

  it('prefers the refresh cookie over the access token', async () => {
    const first = await login();
    await login();

    await logout.execute({ refreshToken: first.refreshToken, accessToken: `access:1:${sessionAt(1).getId()}` });

    expect(sessionAt(0).getEndReason()).toBe('MANUAL');
    expect(sessionAt(1).getEndedAt()).toBeNull();
  });

  it('does not touch the other sessions of the same user', async () => {
    const first = await login();
    const second = await login();

    await logout.execute({ refreshToken: first.refreshToken });

    expect(sessionAt(1).getEndedAt()).toBeNull();
    await expect(refresh.execute({ refreshToken: second.refreshToken })).resolves.toBeDefined();
  });

  it('leaves the refresh token of the closed session useless', async () => {
    const { refreshToken } = await login();

    await logout.execute({ refreshToken });

    await expect(refresh.execute({ refreshToken })).rejects.toBeInstanceOf(Unauthenticated);
  });

  it('keeps the first reason when the session was already closed', async () => {
    const { refreshToken } = await login();
    await sessions.end(sessionAt(0).getId(), 'INACTIVITY', clock.now());
    clock.advanceSeconds(60);

    await logout.execute({ refreshToken });

    expect(sessionAt(0).getEndReason()).toBe('INACTIVITY');
  });

  it.each([
    ['no token at all', {}],
    ['an empty refresh token', { refreshToken: '' }],
    ['an unknown refresh token', { refreshToken: 'a-token-nobody-issued' }],
    ['a garbage access token', { accessToken: 'not.a.jwt' }],
    ['an access token of a session that does not exist', { accessToken: 'access:99:no-such-session' }],
  ])('never fails with %s: logout is always accepted (D-09)', async (_label, command) => {
    await login();

    await expect(logout.execute(command)).resolves.toBeUndefined();

    expect(sessionAt(0).getEndedAt()).toBeNull();
  });
});
