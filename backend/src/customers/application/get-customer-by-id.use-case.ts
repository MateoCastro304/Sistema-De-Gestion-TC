import { Injectable, NotFoundException } from '@nestjs/common';
import { Customer } from '../domain/customer';
import { CustomerRepository } from '../domain/port/customer.repository';

@Injectable()
export class GetCustomerById {
  constructor(private readonly customersRepository: CustomerRepository) {}

  async execute(factoryId: number, id: number): Promise<Customer> {
    const customer = await this.customersRepository.findById(factoryId, id);
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found in factory ${factoryId}`);
    }
    return customer;
  }
}
