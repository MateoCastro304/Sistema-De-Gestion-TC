import { Manager } from '../../../core/domain/entities/manager';

export class ManagerResponseDto {
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

  static fromDomain(manager: Manager): ManagerResponseDto {
    return new ManagerResponseDto(
      String(manager.getId()),
      manager.getName(),
      manager.getLastName() ?? '',
      manager.getPhone() ?? '',
      manager.getMail() ?? '',
      String(manager.getFactoryId()),
      manager.isActive(),
    );
  }
}
