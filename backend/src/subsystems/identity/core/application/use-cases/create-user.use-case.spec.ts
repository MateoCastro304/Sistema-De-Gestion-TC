import { CreateUser } from './create-user.use-case';
import { Employee } from '../../domain/entities/employee.entity';
import { User } from '../../domain/entities/user.entity';
import { EmployeeNotFoundForUser } from '../../domain/errors/employee-not-found-for-user.error';
import { EmployeeInactive } from '../../domain/errors/employee-inactive.error';
import { EmployeeAlreadyHasUser } from '../../domain/errors/employee-already-has-user.error';
import { UsernameAlreadyExists } from '../../domain/errors/username-already-exists.error';
import { InMemoryEmployeeRepository } from '../../../infrastructure/persistence/in-memory/in-memory-employee.repository';
import { InMemoryUserRepository } from '../../../infrastructure/persistence/in-memory/in-memory-user.repository';
import { FakePasswordHasher } from './test-support/identity-fakes';

describe('CreateUser (use case)', () => {
  let repo: InMemoryUserRepository;
  let employees: InMemoryEmployeeRepository;
  let useCase: CreateUser;

  beforeEach(() => {
    repo = new InMemoryUserRepository();
    employees = new InMemoryEmployeeRepository();
    // Hash "de prueba" previsible, nunca bcrypt real en un test unitario.
    useCase = new CreateUser(repo, employees, new FakePasswordHasher());
  });

  const newEmployee = (dni: string) =>
    Employee.create({ firstName: 'Matías', lastName: 'Castro', dni, position: 'EMPLOYEE' });

  const seedEmployee = async (dni = '30111222'): Promise<number> =>
    (await employees.save(newEmployee(dni))).getId() as number;

  const seedInactiveEmployee = (dni = '30111222'): number => employees.seedInactive(newEmployee(dni)).getId() as number;

  const validInput = (employeeId: number) => ({
    employeeId,
    username: 'mcastro',
    password: 'Tz8kq4Rmw2',
    roles: ['EC', 'ER'] as ('EC' | 'ER')[],
  });

  // ---------------------------------------------------------------------------
  // happy path
  // ---------------------------------------------------------------------------
  describe('happy path', () => {
    it('creates the user when the employee exists, is active, and has no user yet', async () => {
      const employeeId = await seedEmployee();

      const result = await useCase.execute(validInput(employeeId));

      expect(result.getId()).not.toBeNull();
      expect(result.getUsername()).toBe('mcastro');
      expect(result.getPasswordHash()).toBe('hashed:Tz8kq4Rmw2');
      expect(result.getRoles()).toEqual(['EC', 'ER']);
      expect(result.getActive()).toBe(true);
      expect(repo.count()).toBe(1);
    });
  });

  describe('username', () => {
    it('is saved in lowercase', async () => {
      const employeeId = await seedEmployee();

      const result = await useCase.execute({ ...validInput(employeeId), username: 'MCastro' });

      expect(result.getUsername()).toBe('mcastro');
    });
  });

  describe('author', () => {
    it('records the session user that registered the account', async () => {
      const employeeId = await seedEmployee();

      const result = await useCase.execute(validInput(employeeId), 5);

      expect(result.getCreatedByUserId()).toBe(5);
    });
  });

  // ---------------------------------------------------------------------------
  // employee checks
  // ---------------------------------------------------------------------------
  describe('employee checks', () => {
    it('rejects when the employee does not exist', async () => {
      await expect(useCase.execute(validInput(999))).rejects.toBeInstanceOf(EmployeeNotFoundForUser);
      expect(repo.count()).toBe(0);
    });

    it('rejects when the employee is inactive', async () => {
      const employeeId = seedInactiveEmployee();

      await expect(useCase.execute(validInput(employeeId))).rejects.toBeInstanceOf(EmployeeInactive);
      expect(repo.count()).toBe(0);
    });

    it('rejects when the employee already has a user, carrying the existing id/username', async () => {
      const employeeId = await seedEmployee();
      await useCase.execute({ ...validInput(employeeId), username: 'gtorres' });

      const call = useCase.execute(validInput(employeeId));

      await expect(call).rejects.toBeInstanceOf(EmployeeAlreadyHasUser);
      await expect(call).rejects.toMatchObject({ existingUsername: 'gtorres' });
      expect(repo.count()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // uniqueness
  // ---------------------------------------------------------------------------
  describe('uniqueness', () => {
    it('rejects a duplicate username, case-insensitive, even against another employee', async () => {
      const first = await seedEmployee('30111222');
      await useCase.execute(validInput(first));
      const second = await seedEmployee('30111333');

      const call = useCase.execute({ ...validInput(second), username: 'MCastro' });

      await expect(call).rejects.toBeInstanceOf(UsernameAlreadyExists);
      expect(repo.count()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // domain validation propagates
  // ---------------------------------------------------------------------------
  describe('domain validation propagates', () => {
    it('rejects a password shorter than 8 characters, before hashing', async () => {
      const employeeId = await seedEmployee();

      await expect(useCase.execute({ ...validInput(employeeId), password: 'short' })).rejects.toThrow(
        'La contraseña debe tener al menos 8 caracteres',
      );
      expect(repo.count()).toBe(0);
    });

    it('rejects an empty roles list', async () => {
      const employeeId = await seedEmployee();

      await expect(useCase.execute({ ...validInput(employeeId), roles: [] })).rejects.toThrow('Asigná al menos un rol');
      expect(repo.count()).toBe(0);
    });
  });
});
