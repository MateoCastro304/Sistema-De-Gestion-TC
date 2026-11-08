import { GetUserById } from './get-user-by-id.use-case';
import { InMemoryUserRepository } from '../../../infrastructure/persistence/in-memory/in-memory-user.repository';
import { User } from '../../domain/entities/user.entity';
import { UserNotFound } from '../../domain/errors/user-not-found.error';

describe('GetUserById (use case)', () => {
  let repo: InMemoryUserRepository;
  let useCase: GetUserById;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    useCase = new GetUserById(repo);
  });

  const seed = async (overrides: { blocked?: boolean; active?: boolean } = {}) => {
    const user = User.create({
      employeeId: 8,
      username: 'hfunes',
      passwordHash: 'hashed',
      roles: ['AT'],
    });
    const stored = await repo.save(user);
    if (overrides.blocked || overrides.active === false) {
      const reconstructed = User.reconstruct({
        id: stored.getId() as number,
        employeeId: stored.getEmployeeId(),
        username: stored.getUsername(),
        passwordHash: stored.getPasswordHash(),
        roles: stored.getRoles(),
        active: overrides.active ?? true,
        employeeActive: true,
        locked: overrides.blocked ?? false,
        lastAccessAt: stored.getLastAccessAt(),
        createdByUserId: null,
        createdAt: stored.getCreatedAt(),
        updatedAt: stored.getUpdatedAt(),
      });
      return repo.save(reconstructed);
    }
    return stored;
  };

  it('returns the user when found', async () => {
    const stored = await seed();

    const result = await useCase.execute(stored.getId() as number);

    expect(result.getUsername()).toBe('hfunes');
    expect(result.getStatus()).toBe('ACTIVE');
  });

  it('returns a blocked user with its computed status', async () => {
    const stored = await seed({ blocked: true });

    const result = await useCase.execute(stored.getId() as number);

    expect(result.getStatus()).toBe('BLOCKED');
  });

  it('throws UserNotFound when the id does not exist', async () => {
    const call = useCase.execute(999);

    await expect(call).rejects.toBeInstanceOf(UserNotFound);
    await expect(call).rejects.toMatchObject({ id: 999 });
  });
});
