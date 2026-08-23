import { FactoryId } from "./factory-id";


export class Factory {
  private constructor(
    private readonly id: FactoryId,
    private cuit: string,
    private name: string,
    private address: string,
    private paymentDescription: string | null,
    private categoryId: CategoryId, // Rubro
    private active: boolean, 
  ) {}

  // OPERATIONS

  // CREATE
    static create(
    id: string,
    cuit: string,
    name: string,
    address: string,
    paymentDescription: string | null,
    categoryId: string,
  ): Factory {
    if (!cuit.trim()){
      throw new Error('Factory cuit cannot be empty');
    }

    if (!name.trim()){
      throw new Error('Factory name cannot be empty');
    }

    if (!address.trim()){
      throw new Error('Factory address cannot be empty');
    }

    return new Factory(
      FactoryId.create(id),
      cuit.trim(),
      name.trim(),
      address.trim(),
      paymentDescription || null,
      CategoryId.create(categoryId),
      true,
    );
    }
  static reconstruct(
      id: string,
      cuit: string,
      name: string,
      address: string,
      paymentDescription: string | null,
      categoryId: string,
      active: boolean,
    ): Factory {
      return new Factory(
        FactoryId.create(id),
        cuit,
        name,
        address,
        paymentDescription,
        CategoryId.create(categoryId),
        active,
      );
    }

// UPDATE
  update(
    cuit: string,
    name: string,
    address: string,
    paymentDescription: string | null,
    categoryId: string,
    ): void {
    this.changeCuit(cuit);
    this.changeName(name);
    this.changeAddress(address);
    this.changePaymentDescription(paymentDescription);
    this.changeCategoryId(categoryId);
  }

  // DELETE
    deactivate(): void {
    if(!this.active){
      throw new Error('Factory is already inactive');
    };
    this.active = false
  }

  // Reactivar (alta logica)
  activate(): void {
    if(this.active){
      throw new Error('Factory is already active');
    }
    this.active = true;
  }

  // CHANGE METHODS

  changeCuit(cuit: string): void{
    if (!cuit.trim()){
      throw new Error('Factory cuit cannot be empty');
    }
    this.cuit = cuit.trim();
  }

    changeName(name: string): void{
        if (!name.trim()){
            throw new Error('Factory name cannot be empty');
        }
        this.name = name.trim();
    }

    changeAddress(address: string): void{
        if (!address.trim()){
            throw new Error('Factory address cannot be empty');
        }   
        this.address = address.trim();
    }

    changePaymentDescription(
        paymentDescription: string | null,
    ): void {
        this.paymentDescription =
            paymentDescription?.trim() || null;
    }

    changeCategoryId(categoryId: string): void{
        this.categoryId = CategoryId.create(categoryId);
    }

    // GETTERS
  getId(): string { return this.id.getValue(); }
  getCuit(): string { return this.cuit; }
  getName(): string { return this.name; }
  getAddress(): string { return this.address; }
  getPaymentDescription(): string | null { return this.paymentDescription; }
  getCategoryId(): string { return this.categoryId.getValue(); }
  isActive(): boolean { return this.active; }

}
