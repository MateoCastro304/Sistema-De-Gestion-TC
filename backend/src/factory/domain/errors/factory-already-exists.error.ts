export class FactoryAlreadyExists extends Error {
  constructor(public readonly cuit: string) {
    super(`Factory with cuit "${cuit}" already exists`);
    this.name = 'FactoryAlreadyExists';
  }
}
