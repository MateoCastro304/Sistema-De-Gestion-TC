export class FactoryHasActiveCustomers extends Error {
  constructor(public readonly factoryId: number) {
    super(`Factory with ID ${factoryId} has active customers and cannot be deactivated`);
    this.name = 'FactoryHasActiveCustomers';
  }
}
