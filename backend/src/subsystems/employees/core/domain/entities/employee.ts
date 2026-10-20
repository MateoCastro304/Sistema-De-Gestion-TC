import { EmployeeFieldError, EmployeeValidationError } from '../errors/employee-validation.error';
import { EmployeePosition, isEmployeePosition } from '../value-objects/employee-position';

// Van tipados `unknown` a propósito, ya que llegan del cuerpo de la petición SIN validar, y la entidad es quien los valida todos juntos

 
export type EmployeeInput = {
  firstName?: unknown;
  lastName?: unknown;
  dni?: unknown;
  position?: unknown;
  address?: unknown;
  email?: unknown;
  phone?: unknown;
};

/** Una fila ya guardada, tal como sale de la base. */
export type EmployeeSnapshot = {
  id: number;
  firstName: string;
  lastName: string;
  dni: string;
  position: EmployeePosition;
  address: string | null;
  email: string | null;
  phone: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type Fail = (field: string, message: string) => void;

const MAX_NAME_LENGTH = 100;
const MAX_ADDRESS_LENGTH = 200;
const MAX_EMAIL_LENGTH = 120;
const MAX_PHONE_LENGTH = 50;

const DNI_PATTERN = /^\d{7,8}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const INVALID_VALUE = 'El valor ingresado no es válido';

function requiredText(raw: unknown, field: string, max: number, missing: string, tooLong: string, fail: Fail): string {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text) {
    fail(field, missing);
  } else if (text.length > max) {
    fail(field, tooLong);
  }
  return text;
}

function optionalText(raw: unknown, field: string, max: number, tooLong: string, fail: Fail): string | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw !== 'string') {
    fail(field, INVALID_VALUE);
    return null;
  }
  const text = raw.trim();
  if (!text) return null;
  if (text.length > max) fail(field, tooLong);
  return text;
}

export class Employee {
  private constructor(
    private readonly _id: number | null,
    private readonly _firstName: string,
    private readonly _lastName: string,
    private readonly _dni: string,
    private readonly _position: EmployeePosition,
    private readonly _address: string | null,
    private readonly _email: string | null,
    private readonly _phone: string | null,
    private readonly _active: boolean,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date,
  ) {}

  static create(input: EmployeeInput): Employee {
    const errors: EmployeeFieldError[] = [];
    const fail: Fail = (field, message) => errors.push({ field, message });

    const firstName = requiredText(
      input.firstName,
      'firstName',
      MAX_NAME_LENGTH,
      'Ingresá el nombre',
      `El nombre no puede superar los ${MAX_NAME_LENGTH} caracteres`,
      fail,
    );
    const lastName = requiredText(
      input.lastName,
      'lastName',
      MAX_NAME_LENGTH,
      'Ingresá el apellido',
      `El apellido no puede superar los ${MAX_NAME_LENGTH} caracteres`,
      fail,
    );

    const dni = Employee.readDni(input.dni, fail);

    let position: EmployeePosition = 'EMPLOYEE';
    if (isEmployeePosition(input.position)) {
      position = input.position;
    } else {
      fail('position', 'Elegí el puesto');
    }

    const address = optionalText(
      input.address,
      'address',
      MAX_ADDRESS_LENGTH,
      `La dirección no puede superar los ${MAX_ADDRESS_LENGTH} caracteres`,
      fail,
    );
    const phone = optionalText(
      input.phone,
      'phone',
      MAX_PHONE_LENGTH,
      `El teléfono no puede superar los ${MAX_PHONE_LENGTH} caracteres`,
      fail,
    );
    const email = optionalText(
      input.email,
      'email',
      MAX_EMAIL_LENGTH,
      `El email no puede superar los ${MAX_EMAIL_LENGTH} caracteres`,
      fail,
    );
    if (email !== null && email.length <= MAX_EMAIL_LENGTH && !EMAIL_PATTERN.test(email)) {
      fail('email', 'Revisá el formato del email');
    }

    if (errors.length > 0) {
      throw new EmployeeValidationError('Los datos enviados no son válidos.', errors);
    }

    const now = new Date();
    return new Employee(null, firstName, lastName, dni, position, address, email, phone, true, now, now);
  }

  static reconstruct(row: EmployeeSnapshot): Employee {
    return new Employee(
      row.id,
      row.firstName,
      row.lastName,
      row.dni,
      row.position,
      row.address,
      row.email,
      row.phone,
      row.active,
      row.createdAt,
      row.updatedAt,
    );
  }

  private static readDni(raw: unknown, fail: Fail): string {
    const text = typeof raw === 'string' ? raw.trim() : raw;
    if (text === undefined || text === null || text === '') {
      fail('dni', 'Ingresá el DNI');
      return '';
    }
    if (typeof text !== 'string' || !DNI_PATTERN.test(text)) {
      fail('dni', 'El DNI tiene que tener 7 u 8 números');
      return '';
    }
    return text;
  }

  getId() {
    return this._id;
  }

  getFirstName() {
    return this._firstName;
  }

  getLastName() {
    return this._lastName;
  }

  getDni() {
    return this._dni;
  }

  getPosition() {
    return this._position;
  }

  getAddress() {
    return this._address;
  }

  getEmail() {
    return this._email;
  }

  getPhone() {
    return this._phone;
  }

  isActive() {
    return this._active;
  }

  getCreatedAt() {
    return this._createdAt;
  }

  getUpdatedAt() {
    return this._updatedAt;
  }
}
