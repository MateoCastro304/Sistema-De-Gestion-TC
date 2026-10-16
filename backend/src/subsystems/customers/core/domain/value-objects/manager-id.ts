export class ManagerId {
  private constructor(private readonly value: number) {}

  static create(value: number): ManagerId {
    if (value === undefined || value === null || !Number.isInteger(value) || value <= 0) {
      throw new Error('Manager id must be a positive integer');
    }
    return new ManagerId(value);
  }

  getValue(): number {
    return this.value;
  }
}
