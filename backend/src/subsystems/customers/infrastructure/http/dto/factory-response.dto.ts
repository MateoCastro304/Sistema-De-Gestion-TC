import { Factory } from '../../../core/domain/entities/factory';

export class FactoryResponseDto {
  id: string;
  legalName: string;
  cuit: string;
  address: string;
  payMethod: string;
  categoryId: string;
  isActive: boolean;

  private constructor(
    id: string,
    legalName: string,
    cuit: string,
    address: string,
    payMethod: string,
    categoryId: string,
    isActive: boolean,
  ) {
    this.id = id;
    this.legalName = legalName;
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
