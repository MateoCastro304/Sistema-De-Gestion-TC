import { CreateUser } from './create-user.use-case';
import { InMemoryUsersRepository } from '../../../infrastructure/persistence/in-memory/in-memory-users.repository';
import { EmployeeQuery, EmployeeSummary } from '../../domain/ports/employee-query.port';
import { PasswordHasher } from '../../domain/ports/password-hasher.port';
import { User } from '../../domain/entities/user';
import { EmployeeNotFoundForUser } from '../../domain/errors/employee-not-found-for-user.error';
import { EmployeeInactive } from '../../domain/errors/employee-inactive.error';
import { EmployeeAlreadyHasUser } from '../../domain/errors/employee-already-has-user.error';
import { UsernameAlreadyExists } from '../../domain/errors/username-already-exists.error';

describe('CreateUser (use case)', () => {
  let repo: InMemoryUsersRepository;
  let employees: Map<number, EmployeeSummary>;
  let employeeQuery: EmployeeQuery;
  let passwordHasher: PasswordHasher;
  let useCase: CreateUser;

  beforeEach(() => {
    repo = new InMemoryUsersRepository();
    employees = new Map();
    employeeQuery = {
      findEmployee: async (employeeId: number) => employees.get(employeeId) ?? null,
    };
    // Hash "de prueba" previsible, nunca bcrypt real en un test unitario.
    passwordHasher = {
      hash: async (plain: string) => `hashed:${plain}`,
    };
    useCase = new CreateUser(repo, employeeQuery, passwordHasher);
  });

  const seedEmployee = (overrides: Partial<EmployeeSummary> = {}): EmployeeSummary => {
    const employee: EmployeeSummary = {
      id: 9,
      firstName: 'Matías',
      lastName: 'Castro',
      active: true,
      ...overrides,
    };
    employees.set(employee.id, employee);
    return employee;
  };

  const validInput = () => ({
    employeeId: 9,
    username: 'mcastro',
    password: 'Tz8kq4Rmw2',
    roles: ['EC', 'ER'] as ('EC' | 'ER')[],
  });

  // ---------------------------------------------------------------------------
  // happy path
  // ---------------------------------------------------------------------------
  describe('happy path', () => {
    it('creates the user when the employee exists, is active, and has no user yet', async () => {
      seedEmployee();

      const result = await useCase.execute(validInput());

      expect(result.getId()).not.toBeNull();
      expect(result.getUsername()).toBe('mcastro');
      expect(result.getPasswordHash()).toBe('hashed:Tz8kq4Rmw2');
      expect(result.getRoles()).toEqual(['EC', 'ER']);
      expect(result.getActive()).toBe(true);
      expect(repo.count()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // employee checks
  // ---------------------------------------------------------------------------
  describe('employee checks', () => {
    it('rejects when the employee does not exist', async () => {
      await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(EmployeeNotFoundForUser);
      expect(repo.count()).toBe(0);
    });

    it('rejects when the employee is inactive', async () => {
      seedEmployee({ active: false });

      await expect(useCase.execute(validInput())).rejects.toBeInstanceOf(EmployeeInactive);
      expect(repo.count()).toBe(0);
    });

    it('rejects when the employee already has a user, carrying the existing id/username', async () => {
      seedEmployee();
      await useCase.execute({ ...validInput(), username: 'gtorres' });

      const call = useCase.execute(validInput());

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
      seedEmployee({ id: 9 });
      await useCase.execute(validInput());
      seedEmployee({ id: 11 });

      const call = useCase.execute({ ...validInput(), employeeId: 11, username: 'MCastro' });

      await expect(call).rejects.toBeInstanceOf(UsernameAlreadyExists);
      expect(repo.count()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // domain validation propagates
  // ---------------------------------------------------------------------------
  describe('domain validation propagates', () => {
    it('rejects a password shorter than 8 characters, before hashing', async () => {
      seedEmployee();

      await expect(useCase.execute({ ...validInput(), password: 'short' })).rejects.toThrow(
        'La contraseña debe tener al menos 8 caracteres',
      );
      expect(repo.count()).toBe(0);
    });

    it('rejects an empty roles list', async () => {
      seedEmployee();

      await expect(useCase.execute({ ...validInput(), roles: [] })).rejects.toThrow('Asigná al menos un rol');
      expect(repo.count()).toBe(0);
    });
  });
});
