import { Injectable, BadRequestException } from '@nestjs/common';
import { isValidPage, PAGE_LIMIT_ERROR } from '../../shared/domain/pagination';
import { CustomerRepository, CustomerListParams, CustomerListResult } from '../domain/port/customer.repository';

@Injectable()
export class ListCustomers {
  constructor(private readonly customersRepository: CustomerRepository) {}

  async execute(params: CustomerListParams): Promise<CustomerListResult> {
    if (!isValidPage(params.page, params.limit)) {
      throw new BadRequestException(PAGE_LIMIT_ERROR);
    }
    return await this.customersRepository.list(params);
  }
}
