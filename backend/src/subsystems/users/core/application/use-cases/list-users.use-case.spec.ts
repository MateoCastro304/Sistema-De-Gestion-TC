import { ListUsers } from './list-users.use-case';
import { InMemoryUsersRepository } from '../../../infrastructure/persistence/in-memory/in-memory-users.repository';
import { User } from '../../domain/entities/user';
import { Role } from '../../domain/value-objects/role';

describe('ListUsers (use case)', () => {
  let repo: InMemoryUsersRepository;
  let useCase: ListUsers;

  beforeEach(() => {
    repo = new InMemoryUsersRepository();
    useCase = new ListUsers(repo);
  });

  const seed = async (username: string, roles: Role[], active = true): Promise<User> => {
    const stored = await repo.save(User.create({ employeeId: Math.random(), username, passwordHash: 'x', roles }));
    if (!active) {
      const reconstructed = User.reconstruct({
        id: stored.getId() as number,
        employeeId: stored.getEmployeeId(),
        username: stored.getUsername(),
        passwordHash: stored.getPasswordHash(),
        roles: stored.getRoles(),
        active: false,
        blocked: false,
        failedAttempts: 0,
        lastAccessAt: null,
        createdAt: stored.getCreatedAt(),
        updatedAt: stored.getUpdatedAt(),
      });
      return repo.save(reconstructed);
    }
    return stored;
  };

  it('returns an empty page when there are no users', async () => {
    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.items).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('returns only active/blocked users by default (CU-07 Escenario 1)', async () => {
    await seed('wcastro', ['AS']);
    await seed('ogimenez', ['JT'], false);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.total).toBe(1);
    expect(result.items[0].getUsername()).toBe('wcastro');
  });

  it('includes inactive users when includeInactive is true', async () => {
    await seed('wcastro', ['AS']);
    await seed('ogimenez', ['JT'], false);

    const result = await useCase.execute({ page: 1, limit: 10, includeInactive: true });

    expect(result.total).toBe(2);
  });

  // CU-07 Escenario 2
  it('filters by role', async () => {
    await seed('fpaz', ['EC']);
    await seed('lbenitez', ['AT']);
    await seed('dcastro', ['ERP', 'EC']);

    const result = await useCase.execute({ page: 1, limit: 10, role: 'EC' });

    expect(result.total).toBe(2);
    const usernames = result.items.map((u) => u.getUsername());
    expect(usernames).toEqual(expect.arrayContaining(['fpaz', 'dcastro']));
  });

  it('filters by username substring, case-insensitively', async () => {
    await seed('dcastro', ['EC']);
    await seed('wcastro', ['AS']);
    await seed('fpaz', ['EC']);

    const result = await useCase.execute({ page: 1, limit: 10, search: 'CASTRO' });

    expect(result.total).toBe(2);
  });

  it('orders results by username', async () => {
    await seed('wcastro', ['AS']);
    await seed('dcastro', ['EC']);
    await seed('ogimenez', ['JT']);

    const result = await useCase.execute({ page: 1, limit: 10 });

    expect(result.items.map((u) => u.getUsername())).toEqual(['dcastro', 'ogimenez', 'wcastro']);
  });

  it('paginates and keeps total counting the full match', async () => {
    for (let i = 1; i <= 5; i++) {
      await seed(`user${i}`, ['EC']);
    }

    const page1 = await useCase.execute({ page: 1, limit: 2 });
    const page3 = await useCase.execute({ page: 3, limit: 2 });

    expect(page1.items).toHaveLength(2);
    expect(page1.total).toBe(5);
    expect(page3.items).toHaveLength(1);
    expect(page3.total).toBe(5);
  });
});
