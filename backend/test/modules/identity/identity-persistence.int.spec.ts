import { Test } from '@nestjs/testing';

import { ClockPort } from '../../../src/shared/clock/clock.port';
import { PrismaModule } from '../../../src/shared/infrastructure/prisma/prisma.module';
import { PrismaClientProvider } from '../../../src/shared/infrastructure/prisma/prisma-client.provider';
import { PrismaService } from '../../../src/shared/infrastructure/prisma/prisma.service';
import { LoginLockTier } from '../../../src/subsystems/identity/core/domain/login-lock-policy';
import { PrismaLoginThrottle } from '../../../src/subsystems/identity/infrastructure/persistence/prisma/prisma-login-throttle';
import { PrismaSessionRepository } from '../../../src/subsystems/identity/infrastructure/persistence/prisma/prisma-session.repository';
import { PrismaUserAuthRepository } from '../../../src/subsystems/identity/infrastructure/persistence/prisma/prisma-user-auth.repository';

const T0 = new Date('2026-11-02T10:00:00.000Z');

// Niveles chicos para que los tests no necesiten cientos de intentos.
const TIERS: LoginLockTier[] = [
  { scope: 'username+ip', threshold: 3, windowSeconds: 900, ladderSeconds: [60] },
  { scope: 'username', threshold: 6, windowSeconds: 3600, ladderSeconds: [120] },
];

describe('identity persistence', () => {
  let prisma: PrismaService;
  let users: PrismaUserAuthRepository;
  let sessions: PrismaSessionRepository;
  let throttle: PrismaLoginThrottle;
  let now = T0;

  const clock = { now: () => now } as ClockPort;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [PrismaModule],
      providers: [
        PrismaUserAuthRepository,
        PrismaSessionRepository,
        { provide: ClockPort, useValue: clock },
        {
          provide: PrismaLoginThrottle,
          useFactory: (clients: PrismaClientProvider) => new PrismaLoginThrottle(clients, clock, TIERS),
          inject: [PrismaClientProvider],
        },
      ],
    }).compile();
    await moduleRef.init();

    prisma = moduleRef.get(PrismaService);
    users = moduleRef.get(PrismaUserAuthRepository);
    sessions = moduleRef.get(PrismaSessionRepository);
    throttle = moduleRef.get(PrismaLoginThrottle);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    now = T0;
    await prisma.loginAttempt.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
    await prisma.employee.deleteMany();
  });

  let dni = 10000000;

  async function createUser(
    username: string,
    roleCodes: string[],
    state: { userActive?: boolean; employeeActive?: boolean } = {},
  ) {
    dni += 1;
    const employee = await prisma.employee.create({
      data: {
        firstName: 'Ana',
        lastName: 'Pérez',
        dni: String(dni),
        position: 'EMPLOYEE',
        searchKey: 'ana perez',
        isActive: state.employeeActive ?? true,
      },
    });
    return prisma.user.create({
      data: {
        employeeId: employee.id,
        username,
        passwordHash: 'hash-no-real',
        isActive: state.userActive ?? true,
        roles: { create: roleCodes.map((code) => ({ role: { connect: { code } } })) },
      },
    });
  }

  describe('PrismaUserAuthRepository', () => {
    it('finds by username ignoring case and returns the employee, the roles in prototype order and the union of permissions', async () => {
      await createUser('dcastro', ['AT', 'ERP']);

      const user = await users.findByUsername('DCastro');

      expect(user?.getUsername()).toBe('dcastro');
      expect(user?.getEmployee()).toMatchObject({ firstName: 'Ana', lastName: 'Pérez' });
      // Orden del prototipo (role.sort_order): ERP antes que AT, aunque se asignaron al revés.
      expect(user?.getRoles()).toEqual(['ERP', 'AT']);
      expect(user?.getPermissions()).toEqual(
        expect.arrayContaining(['customer:manage', 'process-type:manage', 'supplier:manage']),
      );
      expect(user?.getPermissions()).not.toContain('user:manage');
      expect(new Set(user?.getPermissions()).size).toBe(user?.getPermissions().length);
    });

    it('finds by id', async () => {
      const created = await createUser('mcastro', ['AS']);

      const user = await users.findById(created.id);

      expect(user?.getId()).toBe(created.id);
      expect(user?.getPermissions()).toEqual(expect.arrayContaining(['user:manage', 'employee:manage']));
    });

    it('returns null for an unknown username and for an unknown id', async () => {
      expect(await users.findByUsername('nadie')).toBeNull();
      expect(await users.findById(999999)).toBeNull();
    });

    it('marks the user inactive when the user is deactivated', async () => {
      await createUser('baja', ['JT'], { userActive: false });

      expect((await users.findByUsername('baja'))?.isActive()).toBe(false);
    });

    it('marks the user inactive when its employee is deactivated (D-26)', async () => {
      await createUser('empleadobaja', ['JT'], { employeeActive: false });

      expect((await users.findByUsername('empleadobaja'))?.isActive()).toBe(false);
    });
  });

  describe('PrismaSessionRepository', () => {
    const expiresAt = new Date(T0.getTime() + 7 * 24 * 3600 * 1000);
    const tokenHash = 'a'.repeat(64);

    async function openSession() {
      const user = await createUser('sesion', ['EC']);
      return sessions.open({ userId: user.id, refreshTokenHash: tokenHash, now: T0, expiresAt });
    }

    it('opens a session together with its first refresh token', async () => {
      const session = await openSession();

      expect(session.getStartedAt()).toEqual(T0);
      expect(session.getLastActivityAt()).toEqual(T0);
      expect(session.getExpiresAt()).toEqual(expiresAt);
      expect(session.getEndedAt()).toBeNull();

      const token = await sessions.findRefreshTokenByHash(tokenHash);
      expect(token?.getSessionId()).toBe(session.getId());
      expect(token?.getRevokedAt()).toBeNull();
    });

    it('finds a session by id and returns null for an unknown one', async () => {
      const session = await openSession();

      expect((await sessions.findById(session.getId()))?.getUserId()).toBe(session.getUserId());
      expect(await sessions.findById('00000000-0000-4000-8000-000000000000')).toBeNull();
    });

    it('returns null for an unknown refresh token hash', async () => {
      expect(await sessions.findRefreshTokenByHash('b'.repeat(64))).toBeNull();
    });

    it('records activity', async () => {
      const session = await openSession();
      const later = new Date(T0.getTime() + 120 * 1000);

      await sessions.touchActivity(session.getId(), later);

      expect((await sessions.findById(session.getId()))?.getLastActivityAt()).toEqual(later);
    });

    it('ends the session with its reason and revokes the live refresh token', async () => {
      const session = await openSession();
      const endedAt = new Date(T0.getTime() + 300 * 1000);

      await sessions.end(session.getId(), 'MANUAL', endedAt);

      const ended = await sessions.findById(session.getId());
      expect(ended?.getEndedAt()).toEqual(endedAt);
      expect(ended?.getEndReason()).toBe('MANUAL');
      expect((await sessions.findRefreshTokenByHash(tokenHash))?.getRevokedAt()).toEqual(endedAt);
    });

    it('keeps the first end reason when the session is ended twice', async () => {
      const session = await openSession();

      await sessions.end(session.getId(), 'MANUAL', new Date(T0.getTime() + 10 * 1000));
      await sessions.end(session.getId(), 'REVOKED', new Date(T0.getTime() + 20 * 1000));

      expect((await sessions.findById(session.getId()))?.getEndReason()).toBe('MANUAL');
    });
  });

  describe('PrismaLoginThrottle', () => {
    const attempt = { username: 'victima', ip: '10.0.0.1' };

    it('does not lock a key with no failures', async () => {
      expect(await throttle.remainingLockSeconds(attempt)).toBe(0);
    });

    it('locks on reaching the threshold and reports the wait on the failure that triggers it', async () => {
      expect(await throttle.recordFailure(attempt)).toBe(0);
      expect(await throttle.recordFailure(attempt)).toBe(0);
      expect(await throttle.recordFailure(attempt)).toBe(60);

      expect(await throttle.remainingLockSeconds(attempt)).toBe(60);
    });

    it('releases the lock once its time has passed', async () => {
      for (let i = 0; i < 3; i += 1) await throttle.recordFailure(attempt);

      now = new Date(T0.getTime() + 61 * 1000);

      expect(await throttle.remainingLockSeconds(attempt)).toBe(0);
    });

    it('counts failures of usernames that do not exist (no account enumeration)', async () => {
      const unknown = { username: 'fantasma', ip: '10.0.0.9' };

      for (let i = 0; i < 3; i += 1) await throttle.recordFailure(unknown);

      expect(await throttle.remainingLockSeconds(unknown)).toBe(60);
    });

    it('does not lock a different IP on the primary tier', async () => {
      for (let i = 0; i < 3; i += 1) await throttle.recordFailure(attempt);

      expect(await throttle.remainingLockSeconds({ username: 'victima', ip: '10.0.0.2' })).toBe(0);
    });

    it('locks the username on every IP when the backstop tier is reached', async () => {
      // 6 fallos repartidos en IP distintas: ninguna llega al umbral de 3 del nivel principal.
      for (let i = 0; i < 6; i += 1) await throttle.recordFailure({ username: 'victima', ip: `10.1.0.${i}` });

      expect(await throttle.remainingLockSeconds({ username: 'victima', ip: '10.9.9.9' })).toBe(120);
    });

    it('wipes the counters on a successful login', async () => {
      await throttle.recordFailure(attempt);
      await throttle.recordFailure(attempt);

      await throttle.recordSuccess(attempt);
      await throttle.recordFailure(attempt);
      await throttle.recordFailure(attempt);

      expect(await throttle.remainingLockSeconds(attempt)).toBe(0);
    });

    it('does not lose failures when attempts arrive at the same time', async () => {
      await Promise.all([1, 2, 3].map(() => throttle.recordFailure(attempt)));

      expect(await throttle.remainingLockSeconds(attempt)).toBe(60);
    });
  });
});
