import { CreateEmployee } from './create-employee.use-case';
import { InMemoryEmployeeRepository } from '../../../infrastructure/persistence/in-memory/in-memory-employee.repository';
import { Employee } from '../../domain/entities/employee';
import { EmployeeDniTaken } from '../../domain/errors/employee-dni-taken.error';
import { EmployeeValidationError } from '../../domain/errors/employee-validation.error';

const validInput = () => ({
  firstName: 'Julián',
  lastName: 'Ferreyra',
  dni: '42345678',
  position: 'EMPLOYEE',
});

describe('CreateEmployee (use case)', () => {
  let repo: InMemoryEmployeeRepository;
  let useCase: CreateEmployee;

  beforeEach(() => {
    repo = new InMemoryEmployeeRepository();
    useCase = new CreateEmployee(repo);
  });

  // ---------------------------------------------------------------------------
  // happy path
  // ---------------------------------------------------------------------------
  describe('happy path', () => {
    it('persists an employee with only the required fields', async () => {
      const result = await useCase.execute(validInput());

      expect(result.getId()).not.toBeNull();
      expect(result.getFirstName()).toBe('Julián');
      expect(result.getLastName()).toBe('Ferreyra');
      expect(result.getDni()).toBe('42345678');
      expect(result.getPosition()).toBe('EMPLOYEE');
      expect(result.isActive()).toBe(true);
      expect(result.getEmail()).toBeNull();
      expect(repo.count()).toBe(1);
    });

    it('persists an employee with every optional field', async () => {
      const result = await useCase.execute({
        ...validInput(),
        address: 'Av. Colón 1820, Córdoba',
        email: 'jferreyra@castrotorneria.com.ar',
        phone: '+54 351 555-1013',
      });

      expect(result.getAddress()).toBe('Av. Colón 1820, Córdoba');
      expect(result.getEmail()).toBe('jferreyra@castrotorneria.com.ar');
      expect(result.getPhone()).toBe('+54 351 555-1013');
    });

    it('assigns a different id to each employee', async () => {
      const first = await useCase.execute(validInput());
      const second = await useCase.execute({ ...validInput(), dni: '41234567' });

      expect(second.getId()).not.toBe(first.getId());
      expect(repo.count()).toBe(2);
    });

    it('does not warn about homonyms: same name with another dni is accepted (D-18)', async () => {
      await useCase.execute(validInput());

      const homonym = await useCase.execute({ ...validInput(), dni: '41234567' });

      expect(homonym.getId()).not.toBeNull();
      expect(repo.count()).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // uniqueness
  // ---------------------------------------------------------------------------
  describe('uniqueness', () => {
    it('rejects a duplicate dni with EmployeeDniTaken', async () => {
      await useCase.execute(validInput());

      const call = useCase.execute({ ...validInput(), firstName: 'Otro', lastName: 'Empleado' });

      await expect(call).rejects.toBeInstanceOf(EmployeeDniTaken);
      await expect(call).rejects.toMatchObject({ dni: '42345678' });
      expect(repo.count()).toBe(1);
    });

    it('detects a duplicate dni after trimming the incoming value', async () => {
      await useCase.execute(validInput());

      const call = useCase.execute({ ...validInput(), dni: ' 42345678 ' });

      await expect(call).rejects.toBeInstanceOf(EmployeeDniTaken);
      expect(repo.count()).toBe(1);
    });

    // D-15: the dni is unique among ALL employees, dados de baja included.
    it('rejects the dni of an inactive employee', async () => {
      repo.seedInactive(Employee.create(validInput()));

      const call = useCase.execute(validInput());

      await expect(call).rejects.toBeInstanceOf(EmployeeDniTaken);
      expect(repo.count()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // domain validation propagates
  // ---------------------------------------------------------------------------
  describe('domain validation propagates', () => {
    it('rejects missing required fields without touching the repository', async () => {
      const call = useCase.execute({ firstName: '', lastName: '', dni: '', position: undefined });

      await expect(call).rejects.toBeInstanceOf(EmployeeValidationError);
      await expect(call).rejects.toMatchObject({
        details: [
          { field: 'firstName', message: 'Ingresá el nombre' },
          { field: 'lastName', message: 'Ingresá el apellido' },
          { field: 'dni', message: 'Ingresá el DNI' },
          { field: 'position', message: 'Elegí el puesto' },
        ],
      });
      expect(repo.count()).toBe(0);
    });

    it('rejects a malformed dni', async () => {
      await expect(useCase.execute({ ...validInput(), dni: '123' })).rejects.toBeInstanceOf(EmployeeValidationError);
      expect(repo.count()).toBe(0);
    });

    it('rejects an invalid email', async () => {
      await expect(useCase.execute({ ...validInput(), email: 'nope' })).rejects.toBeInstanceOf(EmployeeValidationError);
      expect(repo.count()).toBe(0);
    });

    it('validates before checking uniqueness: an invalid dni is a 400, not a 409', async () => {
      await useCase.execute(validInput());

      const call = useCase.execute({ ...validInput(), dni: '4234567x' });

      await expect(call).rejects.toBeInstanceOf(EmployeeValidationError);
    });
  });
});
