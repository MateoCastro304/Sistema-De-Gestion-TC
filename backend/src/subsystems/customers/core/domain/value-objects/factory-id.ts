export class FactoryId {
  private constructor(private readonly value: number) {}

  static create(value: number): FactoryId {
    if (value === undefined || value === null || !Number.isInteger(value) || value <= 0) {
      throw new Error('Factory id must be a positive integer');
    }
    return new FactoryId(value);
  }

  getValue(): number {
    return this.value;
  }
}
