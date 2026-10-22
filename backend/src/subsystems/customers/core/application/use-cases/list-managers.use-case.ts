import { Injectable, BadRequestException } from '@nestjs/common';
import { isValidPage, PAGE_LIMIT_ERROR } from '../../../../../shared/domain/pagination';
import { ManagerRepository, ManagerListParams, ManagerListResult } from '../../domain/ports/manager.repository';

@Injectable()
export class ListManagers {
  constructor(private readonly managersRepository: ManagerRepository) {}

  async execute(params: ManagerListParams): Promise<ManagerListResult> {
    if (!isValidPage(params.page, params.limit)) {
      throw new BadRequestException(PAGE_LIMIT_ERROR);
    }
    return await this.managersRepository.list(params);
  }
}
