import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Customer } from '../domain/customer';
import { CustomerRepository } from '../domain/port/customer.repository';
import { CreateCustomerDto } from '../http/dto/create-customer.dto';
import { FactoryRepository } from '../../factory/domain/port/factory.repository';
import { CustomerAlreadyExists } from '../domain/errors/customer-already-exists.error';

@Injectable()
export class CreateCustomer {
  constructor(
    private readonly customersRepository: CustomerRepository,
    private readonly factoryRepository: FactoryRepository,
  ) {}

  async execute(factoryId: number, dto: CreateCustomerDto): Promise<Customer> {
    const factory = await this.factoryRepository.findById(factoryId);
    if (!factory) {
      throw new NotFoundException(`Factory with ID ${factoryId} not found`);
    }
    if (!factory.isActive()) {
      throw new ConflictException(`Factory with ID ${factoryId} is inactive`);
    }

    const customer = Customer.create(dto.name, dto.lastName, dto.phone, dto.mail, factoryId);

    const mailTaken = await this.customersRepository.existsByMail(customer.getMail(), factoryId);
    if (mailTaken) {
      throw new ConflictException(new CustomerAlreadyExists(customer.getMail()).message);
    }

    return await this.customersRepository.save(customer);
  }
}
