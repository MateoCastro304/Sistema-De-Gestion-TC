export type SupplierUniqueField = 'cuit' | 'legalName';

export class SupplierAlreadyExists extends Error {
  constructor(
    public readonly field: SupplierUniqueField,
    public readonly value: string,
  ) {
    super(`Supplier with ${field} "${value}" already exists`);
    this.name = 'SupplierAlreadyExists';
  }
}
