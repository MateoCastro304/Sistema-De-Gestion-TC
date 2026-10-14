import { Customer } from '../../domain/customer';

export class CustomerResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  mail: string;
  factoryId: string;
  isActive: boolean;

  private constructor(
    id: string,
    firstName: string,
    lastName: string,
    phone: string,
    mail: string,
    factoryId: string,
    isActive: boolean,
  ) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.mail = mail;
    this.factoryId = factoryId;
    this.isActive = isActive;
  }

  static fromDomain(customer: Customer): CustomerResponseDto {
    return new CustomerResponseDto(
      String(customer.getId()),
      customer.getName(),
      customer.getLastName() ?? '',
      customer.getPhone() ?? '',
      customer.getMail() ?? '',
      String(customer.getFactoryId()),
      customer.isActive(),
    );
  }
}
