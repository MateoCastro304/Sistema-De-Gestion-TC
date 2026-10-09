import { FactoryId } from "./factory-id";
import { CategoryId } from '../../categories/domain/category-id';
import { Cuit } from "../../shared/domain/cuit";


export class Factory {
  private constructor(
    private readonly _id: FactoryId | null,
    private _cuit: Cuit,
    private _name: string,
    private _address: string | null,
    private _paymentDescription: string | null,
    private _categoryId: CategoryId, // Rubro
    private _active: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    this.validate();
  }

  // OPERATIONS

  // CREATE
  static create(
    cuit: string,
    name: string,
    address: string | null,
    paymentDescription: string | null,
    categoryId: number,
  ): Factory {
    const now = new Date();

    return new Factory(
      null,
      Cuit.create(cuit),
      name.trim(),
      address?.trim() || null,
      paymentDescription?.trim() || null,
      CategoryId.create(categoryId),
      true,
      now,
      now,
    );
  }

  static reconstruct(
    id: number,
    cuit: string,
    name: string,
    address: string | null,
    paymentDescription: string | null,
    categoryId: number,
    active: boolean,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
  ): Factory {
    return new Factory(
      FactoryId.create(id),
      Cuit.create(cuit),
      name,
      address,
      paymentDescription,
      CategoryId.create(categoryId),
      active,
      createdAt,
      updatedAt,
    );
  }

  // UPDATE
  update(
    cuit: string,
    name: string,
    address: string | null,
    paymentDescription: string | null,
    categoryId: number,
  ): void {
    this.setCuit(cuit);
    this.setName(name);
    this.setAdress(address);
    this.setPaymentDescription(paymentDescription);
    this.setCategoryId(categoryId);
  }

  // DELETE
  deactivate(): void {
    if (!this._active) {
      throw new Error('Factory is already inactive');
    }
    this._active = false;
    this._updatedAt = new Date();
  }

  // Reactivar (alta logica)
  activate(): void {
    if (this._active) {
      throw new Error('Factory is already active');
    }
    this._active = true;
    this._updatedAt = new Date();
  }

  // VALIDATION

  private validate(): void {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Factory name cannot be empty');
    }
  }

  // CHANGE METHODS

  setName(name: string): void {
    this._name = name.trim();
    this.validate();
  }

  setAdress(address: string | null): void {
    this._address = address?.trim() || null;
  }

  setPaymentDescription(paymentDescription: string | null): void {
    this._paymentDescription = paymentDescription?.trim() || null;
  }

  setCategoryId(categoryId: number): void {
    this._categoryId = CategoryId.create(categoryId);
  }

  setCuit(cuit: string): void {
    this._cuit = Cuit.create(cuit);
  }

  // GETTERS
  getId(): number | null {
    return this._id ? this._id.getValue() : null;
  }

  getCuit(): string { return this._cuit.getCuitValue(); }
  getName(): string { return this._name; }
  getAddress(): string | null { return this._address; }
  getPaymentDescription(): string | null { return this._paymentDescription; }
  getCategoryId(): number { return this._categoryId.getValue(); }
  isActive(): boolean { return this._active; }
  getCreatedAt(): Date { return this._createdAt; }
  getUpdatedAt(): Date { return this._updatedAt; }
}
