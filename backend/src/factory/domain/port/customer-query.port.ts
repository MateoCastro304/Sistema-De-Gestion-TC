export abstract class CustomerQuery {
  abstract hasActiveCustomersForFactory(factoryId: number): Promise<boolean>;
}
