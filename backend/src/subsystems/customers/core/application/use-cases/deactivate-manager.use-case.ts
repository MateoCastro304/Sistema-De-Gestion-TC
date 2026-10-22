import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { ManagerRepository } from '../../domain/ports/manager.repository';

@Injectable()
export class DeactivateManager {
  constructor(private readonly managersRepository: ManagerRepository) {}

  async execute(factoryId: number, id: number): Promise<void> {
    const manager = await this.managersRepository.findById(factoryId, id);
    if (!manager) {
      throw new NotFoundException(`Manager ${id} not found in factory ${factoryId}`);
    }
    if (!manager.isActive()) {
      throw new ConflictException(`Manager ${id} in factory ${factoryId} is already inactive`);
    }
    manager.deactivate();
    await this.managersRepository.update(manager);
  }
}
