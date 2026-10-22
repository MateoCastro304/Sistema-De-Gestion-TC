import { Cuit } from '../../../../../shared/domain/cuit';
import { Mail } from '../../../../../shared/domain/mail';
import { Phone } from '../../../../../shared/domain/phone';
import { DomainValidationError } from '../../../../../shared/domain/errors/domain-validation.error';
import { SupplierType, isSupplierType } from '../value-objects/supplier-type';

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
  observation?: string;
};

/**
 * Fields accepted by a partial update. An absent key means "leave unchanged";
 * an explicit null means "clear this field". The supplierType is set on
 * creation and cannot be modified, so it is not accepted here.
 */
type SupplierChanges = {
  legalName?: string;
  cuit?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  address?: string | null;
  observation?: string | null;
};

/**
 * The fields the invariants are checked against. Cuit, Mail and Phone are not
 * here: those value objects validate themselves on construction, so holding an
 * instance already proves it is valid.
 */
type SupplierState = {
  legalName: string;
  supplierType: SupplierType;
  contactName: string | null;
  address: string | null;
  observation: string | null;
};

/**
 * A row as it comes out of the database, handed to {@link Supplier.reconstruct}.
 *
 * Named instead of positional on purpose: the aggregate carries five
 * interchangeable `string | null` fields (contactName, contactEmail,
 * contactPhone, address, observation), and as positional arguments any two of
 * them could be swapped without TypeScript noticing — the supplier would be
 * stored with the phone in the address column and nothing would fail.
 */
export type SupplierSnapshot = {
  id: number;
  legalName: string;
  cuit: string | null;
  supplierType: SupplierType;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  observation: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

/** The already-validated values the constructor assigns, same naming rationale. */
type SupplierFields = {
  id: number | null;
  legalName: string;
  cuit: Cuit | null;
  supplierType: SupplierType;
  contactName: string | null;
  contactEmail: Mail | null;
  contactPhone: Phone | null;
  address: string | null;
  observation: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

// Required attributes: legalName, supplierType, active, createdAt, updatedAt

export class Supplier {
  // -------------------------------------------------------------------------
  // Constants and fields
  // -------------------------------------------------------------------------

  // Mirror the column widths of the `supplier` table, so a payload the API
  // accepts is always a payload the database can store. Do not widen one
  // without widening the other. contactEmail and contactPhone are not here:
  // the Mail and Phone value objects own their own limits, both stricter than
  // their columns (VARCHAR(255) and VARCHAR(50)).
  private static readonly MAX_LEGAL_NAME_LENGTH = 80;
  private static readonly MAX_CONTACT_NAME_LENGTH = 150;
  private static readonly MAX_ADDRESS_LENGTH = 255;
  private static readonly MAX_OBSERVATION_LENGTH = 255;

  private readonly _id: number | null;
  private _legalName: string;
  private _cuit: Cuit | null;
  private readonly _supplierType: SupplierType;
  private _contactName: string | null;
  private _contactEmail: Mail | null;
  private _contactPhone: Phone | null;
  private _address: string | null;
  private _observation: string | null;
  private _active: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(fields: SupplierFields) {
    this._id = fields.id;
    this._legalName = fields.legalName;
    this._cuit = fields.cuit;
    this._supplierType = fields.supplierType;
    this._contactName = fields.contactName;
    this._contactEmail = fields.contactEmail;
    this._contactPhone = fields.contactPhone;
    this._address = fields.address;
    this._observation = fields.observation;
    this._active = fields.active;
    this._createdAt = fields.createdAt;
    this._updatedAt = fields.updatedAt;

    this.validate();
  }

  // -------------------------------------------------------------------------
  // Factories
  // -------------------------------------------------------------------------

  /** Creates a brand new supplier. It starts active. */
  static create(legalName: string, supplierType: SupplierType, options: SupplierOptions = {}): Supplier {
    const cuitInstance = options.cuit ? Cuit.create(options.cuit) : null;
    const contactEmail = options.contactEmail ? Mail.create(options.contactEmail) : null;
    const contactPhone = options.contactPhone ? Phone.create(options.contactPhone) : null;

    const contactName = Supplier.normalizeOptional(options.contactName);
    const address = Supplier.normalizeOptional(options.address);
    const observation = Supplier.normalizeOptional(options.observation);
    const legalNameTrimmed = legalName.trim();

    const now = new Date();
    return new Supplier({
      id: null,
      legalName: legalNameTrimmed,
      cuit: cuitInstance,
      supplierType,
      contactName,
      contactEmail,
      contactPhone,
      address,
      observation,
      active: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  /** Rebuilds a supplier already stored in the database. */
  static reconstruct(row: SupplierSnapshot): Supplier {
    return new Supplier({
      id: row.id,
      legalName: row.legalName,
      cuit: row.cuit ? Cuit.create(row.cuit) : null,
      supplierType: row.supplierType,
      contactName: row.contactName,
      contactEmail: row.contactEmail ? Mail.create(row.contactEmail) : null,
      contactPhone: row.contactPhone ? Phone.create(row.contactPhone) : null,
      address: row.address,
      observation: row.observation,
      active: row.active,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
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

    const newObservation =
      changes.observation !== undefined ? Supplier.normalizeOptional(changes.observation) : undefined;

    // 2. Validate the state the supplier would end up in.
    const candidate = this.currentState();
    if (newLegalName !== undefined) candidate.legalName = newLegalName;
    if (newContactName !== undefined) candidate.contactName = newContactName;
    if (newAddress !== undefined) candidate.address = newAddress;
    if (newObservation !== undefined) candidate.observation = newObservation;

    Supplier.assertValid(candidate);

    // 3. Only now, assign.
    if (newLegalName !== undefined) this._legalName = newLegalName;
    if (newCuit !== undefined) this._cuit = newCuit;
    if (newContactName !== undefined) this._contactName = newContactName;
    if (newEmail !== undefined) this._contactEmail = newEmail;
    if (newPhone !== undefined) this._contactPhone = newPhone;
    if (newAddress !== undefined) this._address = newAddress;
    if (newObservation !== undefined) this._observation = newObservation;

    this.markUpdated();
  }

  /**
   * Logical deletion: the record is kept and only the active flag changes, so
   * the materials and orders that already reference this supplier stay valid.
   *
   * There is no inverse operation on purpose. Once inactive, the supplier is
   * invisible to every query and its CUIT and legal name are free for another
   * supplier to take, so reactivating it could resurrect a duplicate. To work
   * with that supplier again it is registered anew.
   */
  deactivate(): void {
    if (!this._active) {
      throw new DomainValidationError('Supplier is already inactive');
    }
    this._active = false;
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

  getSupplierType(): SupplierType {
    return this._supplierType;
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

  getObservation() {
    return this._observation;
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
      supplierType: this._supplierType,
      contactName: this._contactName,
      address: this._address,
      observation: this._observation,
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
    if (fields.observation !== null && fields.observation.length > Supplier.MAX_OBSERVATION_LENGTH) {
      throw new DomainValidationError(`Observation must not exceed ${Supplier.MAX_OBSERVATION_LENGTH} characters`);
    }

    // Widened to string on purpose: the parameter is typed SupplierType, so
    // the guard would narrow the false branch to never and the message below
    // would interpolate a never. The runtime check still matters — an unknown
    // value can reach the aggregate from a caller that cast it.
    const supplierType: string = fields.supplierType;
    if (!isSupplierType(supplierType)) {
      throw new DomainValidationError(`Invalid supplier type: ${supplierType}`);
    }
  }

  /** Trims an optional text field and turns a blank value into null. */
  private static normalizeOptional(value: string | null | undefined): string | null {
    const trimmed = value?.trim();
    return trimmed || null;
  }
}
