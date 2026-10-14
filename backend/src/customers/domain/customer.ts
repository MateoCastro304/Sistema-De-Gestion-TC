import { CustomerId } from './customer-id';
import { FactoryId } from '../../factory/domain/factory-id';
import { Mail } from '../../shared/domain/mail';
import { Phone } from '../../shared/domain/phone';
import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';

export class Customer {
  private constructor(
    private readonly _id: CustomerId | null,
    private _name: string,
    private _lastName: string | null,
    private _phone: string | null,
    private _mail: Mail | null,
    private _factoryId: FactoryId, // Fabrica asociada
    private _active: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {}

  // OPERATIONS

  // CREATE
  static create(
    name: string,
    lastName: string | null,
    phone: string | null,
    mail: string | null,
    factoryId: number,
  ): Customer {
    const normalizedName = Customer.requireName(name);
    const normalizedPhone = Customer.toPhone(phone);
    const normalizedMail = Customer.toMail(mail);
    Customer.assertHasContact(normalizedPhone, normalizedMail);

    const now = new Date();

    return new Customer(
      null,
      normalizedName,
      Customer.optionalText(lastName),
      normalizedPhone,
      normalizedMail,
      FactoryId.create(factoryId),
      true,
      now,
      now,
    );
  }

  static reconstruct(
    id: number,
    name: string,
    lastName: string | null,
    phone: string | null,
    mail: string | null,
    factoryId: number,
    active: boolean,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): Customer {
    return new Customer(
      CustomerId.create(id),
      name,
      Customer.optionalText(lastName),
      Customer.optionalText(phone),
      Customer.toMail(mail),
      FactoryId.create(factoryId),
      active,
      createdAt,
      updatedAt,
    );
  }

  // UPDATE: valida todo antes de asignar, para no dejar el objeto a medio modificar.
  update(name: string, lastName: string | null, phone: string | null, mail: string | null, factoryId: number): void {
    const normalizedName = Customer.requireName(name);
    const normalizedLastName = Customer.optionalText(lastName);
    const normalizedPhone = Customer.toPhone(phone);
    const normalizedMail = Customer.toMail(mail);
    const normalizedFactoryId = FactoryId.create(factoryId);
    Customer.assertHasContact(normalizedPhone, normalizedMail);

    this._name = normalizedName;
    this._lastName = normalizedLastName;
    this._phone = normalizedPhone;
    this._mail = normalizedMail;
    this._factoryId = normalizedFactoryId;
    this._updatedAt = new Date();
  }

  // DELETE (baja logica)
  deactivate(): void {
    if (!this._active) {
      throw new Error('Customer is already inactive');
    }
    this._active = false;
    this._updatedAt = new Date();
  }

  // VALIDATION HELPERS

  private static requireName(name: string): string {
    const normalized = name.trim();
    if (!normalized) {
      throw new DomainValidationError('Customer name cannot be empty');
    }
    return normalized;
  }

  private static optionalText(value: string | null): string | null {
    return value?.trim() || null;
  }

  private static toMail(mail: string | null): Mail | null {
    const trimmed = mail?.trim();
    return trimmed ? Mail.create(trimmed) : null;
  }

  // El teléfono se valida y se guarda normalizado (sin separadores). Sólo al
  // crear o modificar: reconstruct() no revalida lo que ya está en la base.
  private static toPhone(phone: string | null): string | null {
    const trimmed = phone?.trim();
    return trimmed ? Phone.create(trimmed).getValue() : null;
  }

  // Regla de negocio: el informe se envía por mail o por teléfono, hace falta al menos uno.
  private static assertHasContact(phone: string | null, mail: Mail | null): void {
    if (!phone && !mail) {
      throw new DomainValidationError('Customer must have at least one contact: phone or mail');
    }
  }

  // CHANGE METHODS

  setName(name: string): void {
    this._name = Customer.requireName(name);
  }

  setLastName(lastName: string | null): void {
    this._lastName = Customer.optionalText(lastName);
  }

  setMail(mail: string | null): void {
    const normalizedMail = Customer.toMail(mail);
    Customer.assertHasContact(this._phone, normalizedMail);
    this._mail = normalizedMail;
  }

  setPhone(phone: string | null): void {
    const normalizedPhone = Customer.toPhone(phone);
    Customer.assertHasContact(normalizedPhone, this._mail);
    this._phone = normalizedPhone;
  }

  setFactoryId(factoryId: number): void {
    this._factoryId = FactoryId.create(factoryId);
  }

  // GETTERS
  getId(): number | null {
    return this._id ? this._id.getValue() : null;
  }
  getName(): string {
    return this._name;
  }
  getLastName(): string | null {
    return this._lastName;
  }
  getPhone(): string | null {
    return this._phone;
  }
  getMail(): string | null {
    return this._mail ? this._mail.getValue() : null;
  }
  getFactoryId(): number {
    return this._factoryId.getValue();
  }
  isActive(): boolean {
    return this._active;
  }
  getCreatedAt(): Date {
    return this._createdAt;
  }
  getUpdatedAt(): Date {
    return this._updatedAt;
  }
}
