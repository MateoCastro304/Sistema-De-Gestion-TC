import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Customer } from '../domain/customer';
import { CustomerRepository } from '../domain/port/customer.repository';
import { FactoryRepository } from '../../factory/domain/port/factory.repository';
import { CustomerAlreadyExists } from '../domain/errors/customer-already-exists.error';

export type CreateCustomerInput = {
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  mail?: string | null;
};

@Injectable()
export class CreateCustomer {
  constructor(
    private readonly customersRepository: CustomerRepository,
    private readonly factoryRepository: FactoryRepository,
  ) {}

  async execute(factoryId: number, input: CreateCustomerInput): Promise<Customer> {
    const factory = await this.factoryRepository.findById(factoryId);
    if (!factory) {
      throw new NotFoundException(`Factory with ID ${factoryId} not found`);
    }
    if (!factory.isActive()) {
      throw new ConflictException(`Factory with ID ${factoryId} is inactive`);
    }

    const customer = Customer.create(
      input.firstName,
      input.lastName ?? null,
      input.phone ?? null,
      input.mail ?? null,
      factoryId,
    );

    const mail = customer.getMail();
    if (mail) {
      const mailTaken = await this.customersRepository.existsByMail(mail, factoryId);
      if (mailTaken) {
        throw new ConflictException(new CustomerAlreadyExists(mail).message);
      }
    }

    return await this.customersRepository.save(customer);
  }
}
