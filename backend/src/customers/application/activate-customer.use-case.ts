import { Injectable, NotFoundException } from '@nestjs/common';
import { CustomerRepository } from '../domain/port/customer.repository';

@Injectable()
export class ActivateCustomer {
  constructor(private readonly customersRepository: CustomerRepository) {}

  async execute(factoryId: number, id: number): Promise<void> {
    const customer = await this.customersRepository.findById(factoryId, id);
    if (!customer) {
      throw new NotFoundException(`Customer ${id} not found in factory ${factoryId}`);
    }
    customer.activate();
    await this.customersRepository.update(customer);
  }
}
