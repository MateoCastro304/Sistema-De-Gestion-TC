export class CategoryId {
    private constructor(private readonly _value: number) {
        this.validate();
    }
      static create(value: number): CategoryId {
    if (value === undefined || value === null || !Number.isInteger(value) || value <= 0) {
      throw new Error('Category id must be a positive integer');
    }
    return new CategoryId(value);
  }
    getValue(): number {
    return this.value;
  }
}
