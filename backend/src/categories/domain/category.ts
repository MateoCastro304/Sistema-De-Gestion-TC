export class Category {
  private _active: boolean = true;

  private constructor(
    private readonly _id: string,
    private _name: string,
  ) {
    this.validate();
  }

  static create(id: string, name: string): Category {
    return new Category(id, name);
  }

  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get active(): boolean {
    return this._active;
  }

  private validate() {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
  }
    rename(newName: string) {
    this._name = newName;
    this.validate();
  }

  deactivate() {
    this._active = false;
  }

  activate() {
    this._active = true;
  }
}