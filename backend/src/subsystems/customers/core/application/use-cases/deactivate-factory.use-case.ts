import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { FactoryRepository } from '../../domain/ports/factory.repository';
import { ManagerQuery } from '../../domain/ports/manager-query.port';
import { FactoryHasActiveManagers } from '../../domain/errors/factory-has-active-managers.error';

@Injectable()
export class DeactivateFactory {
  constructor(
    private readonly factoryRepository: FactoryRepository,
    private readonly managerQuery?: ManagerQuery,
  ) {}

  async execute(id: number): Promise<void> {
    const factory = await this.factoryRepository.findById(id);
    if (!factory) {
      throw new NotFoundException(`Factory with ID ${id} not found`);
    }

    if (!factory.isActive()) {
      throw new ConflictException(`Factory with ID ${id} is already inactive`);
    }

    if (this.managerQuery) {
      const hasActiveManagers = await this.managerQuery.hasActiveManagersForFactory(id);
      if (hasActiveManagers) {
        throw new ConflictException(new FactoryHasActiveManagers(id).message);
      }
    }

    factory.deactivate();
    await this.factoryRepository.update(factory);
  }
}
