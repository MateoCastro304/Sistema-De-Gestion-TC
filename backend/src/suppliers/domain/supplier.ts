import { Cuit } from '../../shared/domain/cuit';
import { Mail } from '../../shared/domain/mail';
import { Phone } from '../../shared/domain/phone';
import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { SupplierType, isSupplierType } from './supplier-type';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Optional data accepted when creating a supplier. */
type SupplierOptions = {
  cuit?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
};

/**
 * Fields accepted by a partial update. An absent key means "leave unchanged";
 * an explicit null means "clear this field". The supplierTypes are set on
 * creation and cannot be modified, so they are not accepted here.
 */
type SupplierChanges = {
  legalName?: string;
  cuit?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
};

/**
 * The fields the invariants are checked against. Cuit, Mail and Phone are not
 * here: those value objects validate themselves on construction, so holding an
 * instance already proves it is valid.
 */
type SupplierState = {
  legalName: string;
  supplierTypes: SupplierType[];
  contactName: string | null;
  address: string | null;
};

// Required attributes: legalName, supplierTypes, active, createdAt, updatedAt

export class Supplier {
  // -------------------------------------------------------------------------
  // Constants and fields
  // -------------------------------------------------------------------------

  private static readonly MAX_LEGAL_NAME_LENGTH = 120;
  private static readonly MAX_CONTACT_NAME_LENGTH = 120;
  private static readonly MAX_ADDRESS_LENGTH = 200;

  // Declared apart from the constructor so it can be stored as a defensive
  // copy: readonly prevents reassigning the field, not mutating the array.
  private readonly _supplierTypes: SupplierType[];

  private constructor(
    private readonly _id: number | null,
    private _legalName: string,
    private _cuit: Cuit | null,
    supplierTypes: SupplierType[],
    private _contactName: string | null,
    private _contactEmail: Mail | null,
    private _contactPhone: Phone | null,
    private _address: string | null,
    private _active: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    this._supplierTypes = [...supplierTypes];
    this.validate();
  }

  // -------------------------------------------------------------------------
  // Factories
  // -------------------------------------------------------------------------

  /** Creates a brand new supplier. It starts active. */
  static create(legalName: string, supplierTypes: SupplierType[], options: SupplierOptions = {}): Supplier {
    const cuitInstance = options.cuit ? Cuit.create(options.cuit) : null;
    const contactEmail = options.contactEmail ? Mail.create(options.contactEmail) : null;
    const contactPhone = options.contactPhone ? Phone.create(options.contactPhone) : null;

    const contactName = Supplier.normalizeOptional(options.contactName);
    const address = Supplier.normalizeOptional(options.address);
    const legalNameTrimmed = legalName.trim();

    const now = new Date();
    return new Supplier(
      null,
      legalNameTrimmed,
      cuitInstance,
      supplierTypes,
      contactName,
      contactEmail,
      contactPhone,
      address,
      true,
      now,
      now,
    );
  }

  /** Rebuilds a supplier already stored in the database. */
  static reconstruct(
    id: number,
    legalNameTrimmed: string,
    cuit: string | null,
    supplierTypes: SupplierType[],
    contactName: string | null,
    contactEmail: string | null,
    contactPhone: string | null,
    address: string | null,
    active: boolean,
    c: Date,
    u: Date,
  ): Supplier {
    const cuitInstance = cuit ? Cuit.create(cuit) : null;
    const email = contactEmail ? Mail.create(contactEmail) : null;
    const phone = contactPhone ? Phone.create(contactPhone) : null;

    return new Supplier(
      id,
      legalNameTrimmed,
      cuitInstance,
      supplierTypes,
      contactName,
      email,
      phone,
      address,
      active,
      c,
      u,
    );
  }

  // -------------------------------------------------------------------------
  // Commands
  // -------------------------------------------------------------------------

  /**
   * Partial update. Every new value is built and validated before a single
   * field is assigned, so a rejected payload leaves the supplier untouched.
   */
  update(changes: SupplierChanges): void {
    // 1. Build the new values. The value objects throw here, before any
    //    assignment happens.
    const newCuit = changes.cuit !== undefined ? (changes.cuit ? Cuit.create(changes.cuit) : null) : undefined;

    const newEmail =
      changes.contactEmail !== undefined
        ? changes.contactEmail
          ? Mail.create(changes.contactEmail)
          : null
        : undefined;

    const newPhone =
      changes.contactPhone !== undefined
        ? changes.contactPhone
          ? Phone.create(changes.contactPhone)
          : null
        : undefined;

    const newLegalName = changes.legalName !== undefined ? changes.legalName.trim() : undefined;

    const newContactName =
      changes.contactName !== undefined ? Supplier.normalizeOptional(changes.contactName) : undefined;

    const newAddress = changes.address !== undefined ? Supplier.normalizeOptional(changes.address) : undefined;

    // 2. Validate the state the supplier would end up in.
    const candidate = this.currentState();
    if (newLegalName !== undefined) candidate.legalName = newLegalName;
    if (newContactName !== undefined) candidate.contactName = newContactName;
    if (newAddress !== undefined) candidate.address = newAddress;

    Supplier.assertValid(candidate);

    // 3. Only now, assign.
    if (newLegalName !== undefined) this._legalName = newLegalName;
    if (newCuit !== undefined) this._cuit = newCuit;
    if (newContactName !== undefined) this._contactName = newContactName;
    if (newEmail !== undefined) this._contactEmail = newEmail;
    if (newPhone !== undefined) this._contactPhone = newPhone;
    if (newAddress !== undefined) this._address = newAddress;

    this.markUpdated();
  }

  /** Logical deletion: the record is kept and only the active flag changes. */
  deactivate(): void {
    if (!this._active) {
      throw new DomainValidationError('Supplier is already inactive');
    }
    this._active = false;
    this.markUpdated();
  }

  /** Brings back a supplier that was logically deleted. */
  activate(): void {
    if (this._active) {
      throw new DomainValidationError('Supplier is already active');
    }
    this._active = true;
    this.markUpdated();
  }

  // -------------------------------------------------------------------------
  // Getters
  // -------------------------------------------------------------------------

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

  // Returns a copy, so the caller cannot mutate the supplier types
  getSupplierTypes(): SupplierType[] {
    return [...this._supplierTypes];
  }

  // Returns the Mail instance or null if not set
  getContactEmail(): Mail | null {
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

  // -------------------------------------------------------------------------
  // Invariants and helpers
  // -------------------------------------------------------------------------

  private markUpdated(): void {
    this._updatedAt = new Date();
  }

  /** Snapshot of the current values, used as the base for a candidate state. */
  private currentState(): SupplierState {
    return {
      legalName: this._legalName,
      supplierTypes: this._supplierTypes,
      contactName: this._contactName,
      address: this._address,
    };
  }

  /** Checks the state the supplier holds right now. */
  private validate(): void {
    Supplier.assertValid(this.currentState());
  }

  /**
   * The business rules, stated over plain values instead of over this, so a
   * candidate state can be checked before it is assigned.
   */
  private static assertValid(fields: SupplierState): void {
    if (!fields.legalName?.trim()) {
      throw new DomainValidationError('Legal name is required');
    }
    if (fields.legalName.length > Supplier.MAX_LEGAL_NAME_LENGTH) {
      throw new DomainValidationError(`Legal name must not exceed ${Supplier.MAX_LEGAL_NAME_LENGTH} characters`);
    }
    if (fields.contactName !== null && fields.contactName.length > Supplier.MAX_CONTACT_NAME_LENGTH) {
      throw new DomainValidationError(`Contact name must not exceed ${Supplier.MAX_CONTACT_NAME_LENGTH} characters`);
    }
    if (fields.address !== null && fields.address.length > Supplier.MAX_ADDRESS_LENGTH) {
      throw new DomainValidationError(`Address must not exceed ${Supplier.MAX_ADDRESS_LENGTH} characters`);
    }

    if (fields.supplierTypes.length === 0) {
      throw new DomainValidationError('At least one supplier type is required');
    }
    if (!fields.supplierTypes.every(isSupplierType)) {
      throw new DomainValidationError(`Invalid supplier type: ${fields.supplierTypes}`);
    }

    const uniqueTypes = new Set(fields.supplierTypes);

    if (uniqueTypes.size !== fields.supplierTypes.length) {
      throw new DomainValidationError('Duplicate supplier types are not allowed');
    }
  }

  /** Trims an optional text field and turns a blank value into null. */
  private static normalizeOptional(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed || null;
  }
}
