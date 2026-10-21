export class FactoryHasActiveManagers extends Error {
  constructor(public readonly factoryId: number) {
    super(`Factory with ID ${factoryId} has active managers and cannot be deactivated`);
    this.name = 'FactoryHasActiveManagers';
  }
}
