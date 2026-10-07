import { Injectable, NotFoundException } from '@nestjs/common';
import { FactoryRepository } from '../domain/port/factory.repository';

@Injectable()
export class ActivateFactory {
  constructor(private readonly factoryRepository: FactoryRepository) {}

  async execute(id: number): Promise<void> {
    const factory = await this.factoryRepository.findById(id);
    if (!factory) {
      throw new NotFoundException(`Factory with ID ${id} not found`);
    }
    factory.activate();
    await this.factoryRepository.update(factory);
  }
}
