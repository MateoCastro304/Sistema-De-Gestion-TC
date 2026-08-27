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
  static create(
    name: string
  ): Category {
    const now = new Date();
    return new Category(null, name, true, now, now);
  }
//RECONSTRUIR un rubro que ya existía en la base de datos
  // (esto lo va a usar el repository más adelante, cuando conectemos Prisma)
  static reconstitute(
    id: number, 
    name: string, 
    active: boolean, 
    createdAt: Date, 
    updatedAt: Date,
  ): Category {
    return new Category(id, name, active, createdAt, updatedAt);
  }


// Getters: formas de LEER los datos desde afuera de la clase
  get id(): number | null {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get active(): boolean {
    return this._active;
  }

    get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }


  private validate() {
    if (!this._name || this._name.trim().length === 0) {
      throw new Error('Category name cannot be empty');
    }
  }

  // Setters: formas de MODIFICAR los datos desde afuera de la clase
    rename(newName: string) {
    this._name = newName;
    this._updatedAt = new Date();
    this.validate();
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