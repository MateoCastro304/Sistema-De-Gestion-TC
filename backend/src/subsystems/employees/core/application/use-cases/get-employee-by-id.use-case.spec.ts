import { GetEmployeeById } from './get-employee-by-id.use-case';
import { InMemoryEmployeeRepository } from '../../../infrastructure/persistence/in-memory/in-memory-employee.repository';
import { Employee } from '../../domain/entities/employee';
import { EmployeeNotFound } from '../../domain/errors/employee-not-found.error';

describe('GetEmployeeById (use case)', () => {
  let repo: InMemoryEmployeeRepository;
  let useCase: GetEmployeeById;

  beforeEach(() => {
    repo = new InMemoryEmployeeRepository();
    useCase = new GetEmployeeById(repo);
  });

  const draft = (dni = '42345678') =>
    Employee.create({ firstName: 'Julián', lastName: 'Ferreyra', dni, position: 'EMPLOYEE' });

  it('returns the employee when the id matches', async () => {
    const stored = await repo.save(draft());

    const result = await useCase.execute(stored.getId()!);

    expect(result.getId()).toBe(stored.getId());
    expect(result.getLastName()).toBe('Ferreyra');
  });

  // D-17: an employee dado de baja is still answered, with active:false.
  it('returns an inactive employee with active false', async () => {
    const stored = repo.seedInactive(draft());

    const result = await useCase.execute(stored.getId()!);

    expect(result.getId()).toBe(stored.getId());
    expect(result.isActive()).toBe(false);
  });

  it('throws EmployeeNotFound when the id does not exist', async () => {
    const call = useCase.execute(999);

    await expect(call).rejects.toBeInstanceOf(EmployeeNotFound);
    await expect(call).rejects.toMatchObject({ id: 999 });
  });

  it('throws EmployeeNotFound even when other employees exist', async () => {
    await repo.save(draft('42345678'));
    await repo.save(draft('41234567'));

    await expect(useCase.execute(999)).rejects.toBeInstanceOf(EmployeeNotFound);
    expect(repo.count()).toBe(2);
  });
});
