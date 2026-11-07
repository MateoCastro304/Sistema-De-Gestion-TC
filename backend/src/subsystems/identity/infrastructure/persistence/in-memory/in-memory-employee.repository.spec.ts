import { Employee } from '../../../core/domain/entities/employee.entity';
import { InMemoryEmployeeRepository } from './in-memory-employee.repository';

describe('InMemoryEmployeeRepository.findByIds', () => {
  let repo: InMemoryEmployeeRepository;

  const draft = (dni: string) => Employee.create({ firstName: 'Ana', lastName: 'Gómez', dni, position: 'EMPLOYEE' });

  beforeEach(() => {
    repo = new InMemoryEmployeeRepository();
  });

  it('returns the requested employees', async () => {
    const first = await repo.save(draft('20000001'));
    await repo.save(draft('20000002'));
    const third = await repo.save(draft('20000003'));

    const result = await repo.findByIds([first.getId()!, third.getId()!]);

    expect(result.map((e) => e.getId())).toEqual([first.getId(), third.getId()]);
  });

  it('omits ids that do not exist', async () => {
    const stored = await repo.save(draft('20000001'));

    const result = await repo.findByIds([stored.getId()!, 999]);

    expect(result.map((e) => e.getId())).toEqual([stored.getId()]);
  });

  it('returns an empty list for no ids', async () => {
    await repo.save(draft('20000001'));

    expect(await repo.findByIds([])).toEqual([]);
  });

  it('includes inactive employees', async () => {
    const inactive = repo.seedInactive(draft('20000001'));

    const result = await repo.findByIds([inactive.getId()!]);

    expect(result).toHaveLength(1);
    expect(result[0].isActive()).toBe(false);
  });
});
