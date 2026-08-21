export class Customer {
  constructor(
    public readonly id: string,
    public name: string,
  ) {
    this.validate();
  }

  private validate() {
    if (!this.name || this.name.trim().length === 0) {
      throw new Error('Customer name cannot be empty');
    }
  }

  rename(newName: string) {
    this.name = newName;
    this.validate();
  }
}
