import { Cuit } from './cuit';
import { Email } from './email';
import { Phone } from './phone';

type SupplierOptions = {
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
};

type SupplierChanges = {
  legalName?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
};

export class Supplier {
  private constructor(
    private readonly _id: number | null,
    private _legalName: string,
    private _cuit: Cuit,
    private _contactName: string,
    private _contactEmail: Email | null,
    private _contactPhone: Phone | null,
    private _address: string | null,
    private _active: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    this.validate();
  }

  static create(
    legalName: string,
    cuit: string,
    contactName: string,
    options: SupplierOptions = {},
  ): Supplier {
    const contactEmail = options.contactEmail
      ? Email.create(options.contactEmail)
      : null;
    const contactPhone = options.contactPhone
      ? Phone.create(options.contactPhone)
      : null;
    const address = options.address ?? null;

    const now = new Date();
    return new Supplier(
      null,
      legalName,
      Cuit.create(cuit),
      contactName,
      contactEmail,
      contactPhone,
      address,
      true,
      now,
      now,
    );
  }

  static reconstitute(
    id: number,
    legalName: string,
    cuit: string,
    contactName: string,
    contactEmail: string | null,
    contactPhone: string | null,
    address: string | null,
    active: boolean,
    c: Date,
    u: Date,
  ): Supplier {
    const email = contactEmail ? Email.create(contactEmail) : null;
    const phone = contactPhone ? Phone.create(contactPhone) : null;

    return new Supplier(
      id,
      legalName,
      Cuit.create(cuit),
      contactName,
      email,
      phone,
      address,
      active,
      c,
      u,
    );
  }

  applyChanges(changes: SupplierChanges): void {
    if (changes.legalName !== undefined)
      this.changeLegalName(changes.legalName);
    if (changes.contactName !== undefined)
      this.changeContactName(changes.contactName);
    if (changes.contactEmail !== undefined)
      this.changeEmail(changes.contactEmail);
    if (changes.contactPhone !== undefined)
      this.changePhone(changes.contactPhone);
    if (changes.address !== undefined) this.changeAddress(changes.address);
  }

  changeLegalName(newLegalName: string): void {
    this._legalName = newLegalName;
    this.touch();
  }

  changeContactName(newName: string): void {
    this._contactName = newName;
    this.touch();
  }

  changeEmail(newEmail: string): void {
    this._contactEmail = Email.create(newEmail);
    this.touch();
  }

  changePhone(newPhone: string): void {
    this._contactPhone = Phone.create(newPhone);
    this.touch();
  }

  changeAddress(newAddress: string): void {
    this._address = newAddress;
    this.touch();
  }

  deactivate() {
    this._active = false;
    this._updatedAt = new Date();
  }

  private touch(): void {
    this._updatedAt = new Date();
    this.validate();
  }

  get id() {
    return this._id;
  }
  get legalName() {
    return this._legalName;
  }
  get cuitValue() {
    return this._cuit.getValue();
  }
  get cuitFormatted() {
    return this._cuit.getFormatted();
  }
  get contactName() {
    return this._contactName;
  }
  get contactEmail() {
    return this._contactEmail;
  }
  get contactPhone() {
    return this._contactPhone;
  }
  get address() {
    return this._address;
  }
  get active() {
    return this._active;
  }
  get createdAt() {
    return this._createdAt;
  }
  get updatedAt() {
    return this._updatedAt;
  }

  private validate() {
    if (!this._legalName?.trim()) {
      throw new Error('Legal name is required');
    }
    if (!this._contactName?.trim()) {
      throw new Error('Contact name is required');
    }
  }
}
