import { CategoryValidationError } from '../errors/category-validation.error';

export class Category {
  private constructor(
    private readonly _id: number | null, //porque era incremental
    private _name: string,
    private _active: boolean,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    this.validate();
  }
  //Crear un rubro NUEVO (todavía no existe en la base)
  static create(name: string): Category {
    const now = new Date();
    return new Category(null, name.trim(), true, now, now);
  }
  //RECONSTRUIR un rubro que ya existía en la base de datos
  // (esto lo va a usar el repository más adelante, cuando conectemos Prisma)
  static reconstruct(id: number, name: string, active: boolean, createdAt: Date, updatedAt: Date): Category {
    return new Category(id, name, active, createdAt, updatedAt);
  }

  // Getters: formas de LEER los datos desde afuera de la clase
  getId(): number | null {
    return this._id;
  }

  getName(): string {
    return this._name;
  }

  getActive(): boolean {
    return this._active;
  }

  getCreatedAt(): Date {
    return this._createdAt;
  }

  getUpdatedAt(): Date {
    return this._updatedAt;
  }

  private validate() {
    Category.assertValidName(this._name);
  }

  /**
   * Checked over a plain value instead of `this`, so a candidate name can be
   * validated before it is assigned (see rename()).
   */
  private static assertValidName(name: string) {
    const trimmed = name?.trim() ?? '';
    if (trimmed.length === 0) {
      throw new CategoryValidationError('Category name cannot be empty');
    }
    if (trimmed.length < 3) {
      throw new CategoryValidationError('Category name must be at least 3 characters long');
    }
  }

  // Setters: formas de MODIFICAR los datos desde afuera de la clase
  rename(newName: string) {
    const trimmed = newName.trim();
    Category.assertValidName(trimmed);
    this._name = trimmed;
    this._updatedAt = new Date();
  }

  // Da de baja el rubro (baja LÓGICA, no lo borra de la base)
  deactivate() {
    this._active = false;
    this._updatedAt = new Date();
  }

  // Reactiva un rubro que estaba dado de baja
  activate() {
    this._active = true;
    this._updatedAt = new Date();
  }
}
