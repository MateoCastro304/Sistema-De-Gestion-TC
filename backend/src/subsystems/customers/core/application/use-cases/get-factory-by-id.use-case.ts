import { Injectable, NotFoundException } from '@nestjs/common';
import { FactoryRepository } from '../../domain/ports/factory.repository';
import { Factory } from '../../domain/entities/factory';

@Injectable()
export class GetFactoryById {
  constructor(private readonly factoryRepository: FactoryRepository) {}

  async execute(id: number): Promise<Factory> {
    const factory = await this.factoryRepository.findById(id);
    if (!factory) {
      throw new NotFoundException(`Factory with ID ${id} not found`);
    }
    return factory;
  }
}
