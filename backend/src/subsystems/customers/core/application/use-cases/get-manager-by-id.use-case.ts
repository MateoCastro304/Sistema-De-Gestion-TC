import { Injectable, NotFoundException } from '@nestjs/common';
import { Manager } from '../../domain/entities/manager';
import { ManagerRepository } from '../../domain/ports/manager.repository';

@Injectable()
export class GetManagerById {
  constructor(private readonly managersRepository: ManagerRepository) {}

  async execute(factoryId: number, id: number): Promise<Manager> {
    const manager = await this.managersRepository.findById(factoryId, id);
    if (!manager) {
      throw new NotFoundException(`Manager ${id} not found in factory ${factoryId}`);
    }
    return manager;
  }
}
