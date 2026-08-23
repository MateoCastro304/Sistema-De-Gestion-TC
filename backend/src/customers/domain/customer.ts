import { CustomerId } from './customer-id';
import { FactoryId } from '../../factory/domain/factory-id';
import { Mail } from './mail';

export class Customer {
  private constructor(
    private readonly id: CustomerId,
    private name: string,
    private lastName: string,
    private phone: string,
    private mail: Mail,
    private factoryId: FactoryId,  // Fabrica asociada
    private active: boolean, 
    
  ) {}
// OPERATIONS 

  // CREATE
  static create(
    id: string,
    name: string,
    lastName: string,
    phone: string,
    mail: string,
    factoryId: string,
  ): Customer {
    if (!name.trim()){
      throw new Error('Customer name cannot be empty');
    }

    if (!lastName.trim()){
      throw new Error('Customer address cannot be empty');
    }

    if (!phone.trim()){
      throw new Error('Customer phone cannot be empty');
    }

    return new Customer(
      CustomerId.create(id),
      name.trim(),
      lastName.trim(),
      phone.trim(),
      Mail.create(mail),
      FactoryId.create(factoryId),
      true,
    );
  }

  static reconstruct(
    id: string,
    name: string,
    lastName: string,
    phone: string,
    mail: string,
    factoryId: string,
    active: boolean,
  ): Customer {
    return new Customer(
      CustomerId.create(id),
      name,
      lastName,
      phone,
      Mail.create(mail),
      FactoryId.create(factoryId),
      active,
    );
  }

  // UPDATE
  update(
    name: string,
    lastName: string,
    phone: string,
    mail: string,
    factory: string,
  ): void {
    this.changeName(name);
    this.changeLastName(lastName);
    this.changePhone(phone);
    this.changeMail(mail);
    this.changeFactory(factory);
  }

  // DELETE (baja logica)
  deactivate(): void {
    if(!this.active){
      throw new Error('Customer is already inactive');
    };
    this.active = false
  }

  // Reactivar (alta logica)
  activate(): void {
    if(this.active){
      throw new Error('Customer is already active');
    }
    this.active = true;
  }

// CHANGE METHODS

  changeName(name:string): void {
    const normalizedName = name.trim();

    if(!normalizedName){ // el trim es para eliminar los espacios vacios
      throw new Error('Customer name cannot be empty');
    }
    this.name = normalizedName;
  }

  changeLastName(lastName: string): void {
    const normalizedLastName = lastName.trim();

    if (!normalizedLastName) {
      throw new Error('Encargado last name cannot be empty');
    }

    this.lastName = normalizedLastName;
    }

  changeMail(mail: string): void {
    this.mail = Mail.create(mail);
  }

  changePhone(phone:string): void {
    const normalizedPhone = phone.trim();

    if(!normalizedPhone){
      throw new Error('Customer phone cannot be empty');
    }
    this.phone = normalizedPhone;
  }

  changeFactory(factory:string): void {
    if(!factory.trim()){
      throw new Error('Customer factory cannot be empty');
    }
    this.factoryId = FactoryId.create(factory);
  }

  getId(): string {return this.id.getValue();}
  getName(): string { return this.name; }
  getLastName(): string { return this.lastName; }
  getPhone(): string { return this.phone; }
  getMail(): string { return this.mail.getValue(); }
  getFactoryId(): string { return this.factoryId.getValue(); }
  isActive(): boolean { return this.active; }



}
