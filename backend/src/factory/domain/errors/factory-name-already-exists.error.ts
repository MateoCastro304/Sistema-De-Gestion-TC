export class FactoryNameAlreadyExists extends Error {
  constructor(public readonly factoryName: string) {
    super(`Factory with name "${factoryName}" already exists`);
    this.name = 'FactoryNameAlreadyExists';
  }
}
