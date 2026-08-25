export class Category {
  private _active: boolean = true;

  private constructor(
    private readonly _id: number | null,
    private _name: string,
  ) {
    this.validate();
  }

  static create(name: string): Category {
    return new Category(null, name);
  }

  static reconstitute(id: number, name: string, active: boolean): Category {
    const category = new Category(id, name);
    if (!active) category.deactivate();
    return category;
  }

  get id(): number | null {
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