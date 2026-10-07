import { Injectable, BadRequestException } from '@nestjs/common';
import { FactoryRepository, FactoryListParams, FactoryListResult } from '../domain/port/factory.repository';

@Injectable()
export class ListFactories {
  constructor(private readonly factoryRepository: FactoryRepository) {}

  async execute(params: FactoryListParams): Promise<FactoryListResult> {
    if (params.page < 1 || params.limit < 1) {
      throw new BadRequestException('page and limit must be positive integers');
    }
    return await this.factoryRepository.list(params);
  }
}
