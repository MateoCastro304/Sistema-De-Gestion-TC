import { Cuit } from './cuit';
import { Email } from './email';
import { Phone } from './phone';

type SupplierOptions = {
  cuit?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
};

type SupplierChanges = {
  legalName?: string;
  cuit?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
};

// Atributos required: legalName, active, createdAt, updatedAt

export class Supplier {
  private constructor(
    private readonly _id: number | null,
    private _legalName: string,
    private _cuit: Cuit | null,
    private _contactName: string | null,
    private _contactEmail: Email | null,
    private _contactPhone: Phone | null,
    private _address: string | null,
    private _active: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    this.validate();
  }

  // CREATE A SUPPLIER

  static create(legalName: string, options: SupplierOptions = {}): Supplier {
    const cuitInstance = options.cuit ? Cuit.create(options.cuit) : null;
    const contactEmail = options.contactEmail ? Email.create(options.contactEmail) : null;
    const contactPhone = options.contactPhone ? Phone.create(options.contactPhone) : null;

    const contactName = options.contactName?.trim() ?? null;
    const address = options.address?.trim() ?? null;
    const legalNameTrimmed = legalName.trim();

    const now = new Date();
    return new Supplier(
      null,
      legalNameTrimmed,
      cuitInstance,
      contactName,
      contactEmail,
      contactPhone,
      address,
      true,
      now,
      now,
    );
  }

  // RECONSTRUCT A SUPPLIER FROM DATABASE

  static reconstruct(
    id: number, 
    legalNameTrimmed: string,
    cuit: string | null,
    contactName: string | null,
    contactEmail: string | null,
    contactPhone: string | null,
    address: string | null,
    active: boolean,
    c: Date,
    u: Date,
  ): Supplier {
    const cuitInstance = cuit ? Cuit.create(cuit) : null;
    const email = contactEmail ? Email.create(contactEmail) : null;
    const phone = contactPhone ? Phone.create(contactPhone) : null;

    return new Supplier(id, legalNameTrimmed, cuitInstance, contactName, email, phone, address, active, c, u);
  }

  // PATCH A SUPPLIER

  update(changes: SupplierChanges): void {
    if (changes.legalName !== undefined) this.setLegalName(changes.legalName);
    if (changes.cuit !== undefined) this.setCuit(changes.cuit);
    if (changes.contactName !== undefined) this.setContactName(changes.contactName);
    if (changes.contactEmail !== undefined) this.setEmail(changes.contactEmail);
    if (changes.contactPhone !== undefined) this.setPhone(changes.contactPhone);
    if (changes.address !== undefined) this.setAddress(changes.address);
    this.touch();
  }

  // DELETE LOGICALLY A SUPPLIER
  
  deactivate() {
    if (!this._active) {
      throw new Error('Supplier is already inactive');
    }
    this._active = false;
    this._updatedAt = new Date();
  }

  // ACTIVATE A SUPPLIER IF IT WAS DELETE LOGICALLY

  activate() {
    if (this._active) {
      throw new Error('Supplier is already active');
    }
    this._active = true;
    this._updatedAt = new Date();
  }

  setLegalName(newLegalName: string): void {
    this._legalName = newLegalName;
    this.touch();
  }

  
  setContactName(newName: string): void {
    this._contactName = newName;
    this.touch();
  }
  
  setCuit(newCuit: string): void {
    this._cuit = Cuit.create(newCuit);
    this.touch();
  }
  
  setEmail(newEmail: string): void {
    this._contactEmail = Email.create(newEmail);
    this.touch();
  }

  setPhone(newPhone: string): void {
    this._contactPhone = Phone.create(newPhone);
    this.touch();
  }

  setAddress(newAddress: string): void {
    this._address = newAddress;
    this.touch();
  }


  private touch(): void {
    this._updatedAt = new Date();
    this.validate();
  }

  getId() {
    return this._id;
  }
  getLegalName() {
    return this._legalName;
  }

  // Returns the Cuit instance or null if not set
  getCuit(): Cuit | null {
    return this._cuit;
  }
  
  // Returns the Email instance or null if not set
  getContactEmail(): Email | null {
    return this._contactEmail;
  }

  // Returns the Phone instance or null if not set
  getContactPhone(): Phone | null {
    return this._contactPhone;
  }

  getContactName() {
    return this._contactName;
  }
  getAddress() {
    return this._address;
  }
  getActive() {
    return this._active;
  }
  getCreatedAt() {
    return this._createdAt;
  }
  getUpdatedAt() {
    return this._updatedAt;
  }

  private validate() {
    if (!this._legalName?.trim()) {
      throw new Error('Legal name is required');
    }
  }
}
