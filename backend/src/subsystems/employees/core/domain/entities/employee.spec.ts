import { Employee, EmployeeInput } from './employee';
import { EmployeeValidationError } from '../errors/employee-validation.error';

const validInput = (): EmployeeInput => ({
  firstName: 'Julián',
  lastName: 'Ferreyra',
  dni: '42345678',
  position: 'EMPLOYEE',
});


function validationErrorOf(input: EmployeeInput): EmployeeValidationError {
  try {
    Employee.create(input);
  } catch (error) {
    if (error instanceof EmployeeValidationError) return error;
    throw error;
  }
  throw new Error('Employee.create should have thrown');
}

describe('Employee (domain)', () => {
  // ---------------------------------------------------------------------------
  // create
  // ---------------------------------------------------------------------------
  describe('create', () => {
    it('creates an employee with only the required fields', () => {
      const e = Employee.create(validInput());

      expect(e.getId()).toBeNull();
      expect(e.getFirstName()).toBe('Julián');
      expect(e.getLastName()).toBe('Ferreyra');
      expect(e.getDni()).toBe('42345678');
      expect(e.getPosition()).toBe('EMPLOYEE');
      expect(e.getAddress()).toBeNull();
      expect(e.getEmail()).toBeNull();
      expect(e.getPhone()).toBeNull();
    });

    it('accepts and stores every optional field', () => {
      const e = Employee.create({
        ...validInput(),
        address: 'Av. Colón 1820, Córdoba',
        email: 'jferreyra@castrotorneria.com.ar',
        phone: '+54 351 555-1013',
      });

      expect(e.getAddress()).toBe('Av. Colón 1820, Córdoba');
      expect(e.getEmail()).toBe('jferreyra@castrotorneria.com.ar');
      expect(e.getPhone()).toBe('+54 351 555-1013');
    });

    it('starts active', () => {
      expect(Employee.create(validInput()).isActive()).toBe(true);
    });

    it('starts without a user', () => {
      expect(Employee.create(validInput()).getUser()).toBeNull();
    });

    it('trims the texts', () => {
      const e = Employee.create({
        firstName: '  Julián ',
        lastName: ' Ferreyra  ',
        dni: ' 42345678 ',
        position: 'HEAD',
        address: '  Av. Colón 1820 ',
        email: ' jferreyra@castrotorneria.com.ar ',
        phone: ' +54 351 555-1013 ',
      });

      expect(e.getFirstName()).toBe('Julián');
      expect(e.getLastName()).toBe('Ferreyra');
      expect(e.getDni()).toBe('42345678');
      expect(e.getAddress()).toBe('Av. Colón 1820');
      expect(e.getEmail()).toBe('jferreyra@castrotorneria.com.ar');
      expect(e.getPhone()).toBe('+54 351 555-1013');
    });

    it('turns blank or null optional fields into null', () => {
      const e = Employee.create({ ...validInput(), address: '', email: '   ', phone: null });

      expect(e.getAddress()).toBeNull();
      expect(e.getEmail()).toBeNull();
      expect(e.getPhone()).toBeNull();
    });

    it.each(['ADMINISTRATION', 'WORKSHOP_HEAD', 'HEAD', 'EMPLOYEE'])('accepts the position %s', (position) => {
      expect(Employee.create({ ...validInput(), position }).getPosition()).toBe(position);
    });

    it('accepts a 7-digit dni', () => {
      expect(Employee.create({ ...validInput(), dni: '1234567' }).getDni()).toBe('1234567');
    });
  });

  // ---------------------------------------------------------------------------
  // validation
  // ---------------------------------------------------------------------------
  describe('validation', () => {
    it('reports every missing required field at once', () => {
      const error = validationErrorOf({ firstName: undefined, lastName: '', dni: undefined, position: undefined });

      expect(error.message).toBe('Los datos enviados no son válidos.');
      expect(error.details).toEqual([
        { field: 'firstName', message: 'Ingresá el nombre' },
        { field: 'lastName', message: 'Ingresá el apellido' },
        { field: 'dni', message: 'Ingresá el DNI' },
        { field: 'position', message: 'Elegí el puesto' },
      ]);
    });

    it('treats blank required texts as missing', () => {
      const error = validationErrorOf({ ...validInput(), firstName: '   ', dni: '  ' });

      expect(error.details).toEqual([
        { field: 'firstName', message: 'Ingresá el nombre' },
        { field: 'dni', message: 'Ingresá el DNI' },
      ]);
    });

    it.each(['123456', '123456789', '42.345.678', '4234567a', '12 345 678'])('rejects the dni "%s"', (dni) => {
      const error = validationErrorOf({ ...validInput(), dni });

      expect(error.details).toEqual([{ field: 'dni', message: 'El DNI tiene que tener 7 u 8 números' }]);
    });

    it('rejects a dni that is not a string', () => {
      const error = validationErrorOf({ ...validInput(), dni: 42345678 });

      expect(error.details).toEqual([{ field: 'dni', message: 'El DNI tiene que tener 7 u 8 números' }]);
    });

    it('rejects an unknown position', () => {
      const error = validationErrorOf({ ...validInput(), position: 'MANAGER' });

      expect(error.details).toEqual([{ field: 'position', message: 'Elegí el puesto' }]);
    });

    it.each(['not-an-email', 'a@b', '@x.com', 'a b@x.com'])('rejects the email "%s"', (email) => {
      const error = validationErrorOf({ ...validInput(), email });

      expect(error.details).toEqual([{ field: 'email', message: 'Revisá el formato del email' }]);
    });

    it('reports format errors of several fields together', () => {
      const error = validationErrorOf({ ...validInput(), dni: '123', email: 'nope' });

      expect(error.details).toEqual([
        { field: 'dni', message: 'El DNI tiene que tener 7 u 8 números' },
        { field: 'email', message: 'Revisá el formato del email' },
      ]);
    });

    it('rejects an optional field that is not a string', () => {
      const error = validationErrorOf({ ...validInput(), phone: 123 });

      expect(error.details).toEqual([{ field: 'phone', message: 'El valor ingresado no es válido' }]);
    });

    describe('length limits', () => {
      it.each([
        ['firstName', 100],
        ['lastName', 100],
        ['address', 200],
        ['phone', 50],
      ])('accepts %s of exactly %i characters and rejects one more', (field, max) => {
        expect(() => Employee.create({ ...validInput(), [field]: 'a'.repeat(max) })).not.toThrow();

        const error = validationErrorOf({ ...validInput(), [field]: 'a'.repeat(max + 1) });
        expect(error.details).toHaveLength(1);
        expect(error.details[0].field).toBe(field);
      });

      it('accepts an email of exactly 120 characters and rejects one more', () => {
        const email = (length: number) => `${'a'.repeat(length - '@x.com'.length)}@x.com`;

        expect(() => Employee.create({ ...validInput(), email: email(120) })).not.toThrow();

        const error = validationErrorOf({ ...validInput(), email: email(121) });
        expect(error.details).toEqual([{ field: 'email', message: 'El email no puede superar los 120 caracteres' }]);
      });
    });
  });

  // ---------------------------------------------------------------------------
  // reconstruct
  // ---------------------------------------------------------------------------
  describe('reconstruct', () => {
    it('rebuilds an inactive employee from a stored row', () => {
      const createdAt = new Date('2026-03-12T12:00:00.000Z');
      const updatedAt = new Date('2026-04-01T09:30:00.000Z');

      const e = Employee.reconstruct({
        id: 7,
        firstName: 'Gabriela',
        lastName: 'Torres',
        dni: '28789012',
        position: 'ADMINISTRATION',
        address: null,
        email: 'gtorres@castrotorneria.com.ar',
        phone: null,
        active: false,
        createdAt,
        updatedAt,
      });

      expect(e.getId()).toBe(7);
      expect(e.getPosition()).toBe('ADMINISTRATION');
      expect(e.isActive()).toBe(false);
      expect(e.getCreatedAt()).toBe(createdAt);
      expect(e.getUpdatedAt()).toBe(updatedAt);
      expect(e.getUser()).toBeNull();
    });

    it('rebuilds an employee with its user summary', () => {
      const user = { id: 6, username: 'gtorres', roles: ['ER' as const], status: 'ACTIVE' as const };

      const e = Employee.reconstruct({
        id: 6,
        firstName: 'Gabriela',
        lastName: 'Torres',
        dni: '28789012',
        position: 'ADMINISTRATION',
        address: null,
        email: null,
        phone: null,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        user,
      });

      expect(e.getUser()).toEqual(user);
    });
  });
});
