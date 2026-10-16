import { Injectable, BadRequestException } from '@nestjs/common';
import { isValidPage, PAGE_LIMIT_ERROR } from '../../../../../shared/domain/pagination';
import { FactoryRepository, FactoryListParams, FactoryListResult } from '../../domain/ports/factory.repository';

@Injectable()
export class ListFactories {
  constructor(private readonly factoryRepository: FactoryRepository) {}

  async execute(params: FactoryListParams): Promise<FactoryListResult> {
    if (!isValidPage(params.page, params.limit)) {
      throw new BadRequestException(PAGE_LIMIT_ERROR);
    }
    return await this.factoryRepository.list(params);
  }
}
