import { Factory } from '../../domain/factory';

export class FactoryResponseDto {
  id: string;
  name: string;
  cuit: string;
  address: string;
  payMethod: string;
  categoryId: string;
  isActive: boolean;

  private constructor(
    id: string,
    name: string,
    cuit: string,
    address: string,
    payMethod: string,
    categoryId: string,
    isActive: boolean,
  ) {
    this.id = id;
    this.name = name;
    this.cuit = cuit;
    this.address = address;
    this.payMethod = payMethod;
    this.categoryId = categoryId;
    this.isActive = isActive;
  }

  static fromDomain(factory: Factory): FactoryResponseDto {
    return new FactoryResponseDto(
      String(factory.getId()),
      factory.getName(),
      factory.getCuit(),
      factory.getAddress() ?? '',
      factory.getPaymentDescription() ?? '',
      String(factory.getCategoryId()),
      factory.isActive(),
    );
  }
}
