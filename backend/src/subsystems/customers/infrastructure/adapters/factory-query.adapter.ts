import { Injectable } from '@nestjs/common';
import { FactoryQuery, ActiveFactorySummary } from '../../core/domain/ports/factory-query.port';
import { FactoryRepository } from '../../core/domain/ports/factory.repository';

@Injectable()
export class FactoryQueryAdapter implements FactoryQuery {
  constructor(private readonly factoryRepository: FactoryRepository) {}

  async getActiveFactoriesForCategory(categoryId: number): Promise<ActiveFactorySummary[]> {
    const all = await this.factoryRepository.findAll();
    return all
      .filter((factory) => factory.getCategoryId() === categoryId && factory.isActive())
      .map((factory) => ({ id: factory.getId() as number, name: factory.getName() }));
  }
}
