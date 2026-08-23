export class FactoryId {
  private constructor(
    private readonly value: string,
  ) {}

  static create(value: string): FactoryId {
    if (!value.trim()) {
      throw new Error('Factory id cannot be empty');
    }

    return new FactoryId(value);
  }

  getValue(): string {
    return this.value;
  }
}