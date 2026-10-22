export abstract class ManagerQuery {
  abstract hasActiveManagersForFactory(factoryId: number): Promise<boolean>;
}
