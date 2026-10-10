import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { FactoryRepository } from '../domain/port/factory.repository';
import { CustomerQuery } from '../domain/port/customer-query.port';
import { FactoryHasActiveCustomers } from '../domain/errors/factory-has-active-customers.error';

@Injectable()
export class DeactivateFactory {
  constructor(
    private readonly factoryRepository: FactoryRepository,
    private readonly customerQuery?: CustomerQuery,
  ) {}

  async execute(id: number): Promise<void> {
    const factory = await this.factoryRepository.findById(id);
    if (!factory) {
      throw new NotFoundException(`Factory with ID ${id} not found`);
    }

    if (!factory.isActive()) {
      throw new ConflictException(`Factory with ID ${id} is already inactive`);
    }

    if (this.customerQuery) {
      const hasActiveCustomers = await this.customerQuery.hasActiveCustomersForFactory(id);
      if (hasActiveCustomers) {
        throw new ConflictException(new FactoryHasActiveCustomers(id).message);
      }
    }

    factory.deactivate();
    await this.factoryRepository.update(factory);
  }
}
