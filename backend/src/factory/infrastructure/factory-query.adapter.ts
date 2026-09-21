import { Injectable } from '@nestjs/common';
import { FactoryQuery } from '../../categories/domain/ports/factory-query.port';
import { FactoryRepository } from '../domain/port/factory.repository';

@Injectable()
export class FactoryQueryAdapter implements FactoryQuery {
  constructor(private readonly factoryRepository: FactoryRepository) {}

  async hasActiveFactoriesForCategory(categoryId: number): Promise<boolean> {
    const { total } = await this.factoryRepository.list({
      page: 1,
      limit: 1,
      categoryId,
      active: true,
    });

    return total > 0;
  }
}
