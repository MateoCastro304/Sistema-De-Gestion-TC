export class SupplierNotFound extends Error {
  constructor(public readonly id: number) {
    super(`Supplier with id ${id} not found`);
    this.name = 'SupplierNotFound';
  }
}
