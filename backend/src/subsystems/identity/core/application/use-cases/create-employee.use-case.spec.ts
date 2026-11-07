import { CreateEmployee } from './create-employee.use-case';
import { InMemoryEmployeeRepository } from '../../../infrastructure/persistence/in-memory/in-memory-employee.repository';
import { Employee } from '../../domain/entities/employee.entity';
import { EmployeeDniTaken } from '../../domain/errors/employee-dni-taken.error';
import { EmployeeValidationError } from '../../domain/errors/employee-validation.error';

const validInput = () => ({
  firstName: 'Julián',
  lastName: 'Ferreyra',
  dni: '42345678',
  position: 'EMPLOYEE',
});

const AUTHOR_ID = 1;

describe('CreateEmployee (use case)', () => {
  let repo: InMemoryEmployeeRepository;
  let useCase: CreateEmployee;
  const create = (input: Parameters<CreateEmployee['execute']>[0]) => useCase.execute(input, AUTHOR_ID);

  beforeEach(() => {
    repo = new InMemoryEmployeeRepository();
    useCase = new CreateEmployee(repo);
  });

  // ---------------------------------------------------------------------------
  // happy path
  // ---------------------------------------------------------------------------
  describe('happy path', () => {
    it('persists an employee with only the required fields', async () => {
      const result = await create(validInput());

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
      const result = await create({
        ...validInput(),
        address: 'Av. Colón 1820, Córdoba',
        email: 'jferreyra@castrotorneria.com.ar',
        phone: '+54 351 555-1013',
      });

      expect(result.getAddress()).toBe('Av. Colón 1820, Córdoba');
      expect(result.getEmail()).toBe('jferreyra@castrotorneria.com.ar');
      expect(result.getPhone()).toBe('+54 351 555-1013');
    });

    it('records who registered the employee (D-43)', async () => {
      const result = await create(validInput());

      expect(result.getCreatedByUserId()).toBe(AUTHOR_ID);
    });

    it('assigns a different id to each employee', async () => {
      const first = await create(validInput());
      const second = await create({ ...validInput(), dni: '41234567' });

      expect(second.getId()).not.toBe(first.getId());
      expect(repo.count()).toBe(2);
    });

    it('does not warn about homonyms: same name with another dni is accepted (D-18)', async () => {
      await create(validInput());

      const homonym = await create({ ...validInput(), dni: '41234567' });

      expect(homonym.getId()).not.toBeNull();
      expect(repo.count()).toBe(2);
    });
  });

  // ---------------------------------------------------------------------------
  // uniqueness
  // ---------------------------------------------------------------------------
  describe('uniqueness', () => {
    it('rejects a duplicate dni with EmployeeDniTaken', async () => {
      await create(validInput());

      const call = create({ ...validInput(), firstName: 'Otro', lastName: 'Empleado' });

      await expect(call).rejects.toBeInstanceOf(EmployeeDniTaken);
      await expect(call).rejects.toMatchObject({ dni: '42345678' });
      expect(repo.count()).toBe(1);
    });

    it('detects a duplicate dni after trimming the incoming value', async () => {
      await create(validInput());

      const call = create({ ...validInput(), dni: ' 42345678 ' });

      await expect(call).rejects.toBeInstanceOf(EmployeeDniTaken);
      expect(repo.count()).toBe(1);
    });

    // D-15: the dni is unique among ALL employees, dados de baja included.
    it('rejects the dni of an inactive employee', async () => {
      repo.seedInactive(Employee.create(validInput()));

      const call = create(validInput());

      await expect(call).rejects.toBeInstanceOf(EmployeeDniTaken);
      expect(repo.count()).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // domain validation propagates
  // ---------------------------------------------------------------------------
  describe('domain validation propagates', () => {
    it('rejects missing required fields without touching the repository', async () => {
      const call = create({ firstName: '', lastName: '', dni: '', position: undefined });

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
      await expect(create({ ...validInput(), dni: '123' })).rejects.toBeInstanceOf(EmployeeValidationError);
      expect(repo.count()).toBe(0);
    });

    it('rejects an invalid email', async () => {
      await expect(create({ ...validInput(), email: 'nope' })).rejects.toBeInstanceOf(EmployeeValidationError);
      expect(repo.count()).toBe(0);
    });

    it('validates before checking uniqueness: an invalid dni is a 400, not a 409', async () => {
      await create(validInput());

      const call = create({ ...validInput(), dni: '4234567x' });

      await expect(call).rejects.toBeInstanceOf(EmployeeValidationError);
    });
  });
});
