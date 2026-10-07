import { Injectable, BadRequestException } from '@nestjs/common';
import { CustomerRepository, CustomerListParams, CustomerListResult } from '../domain/port/customer.repository';

@Injectable()
export class ListCustomers {
  constructor(private readonly customersRepository: CustomerRepository) {}

  async execute(params: CustomerListParams): Promise<CustomerListResult> {
    if (params.page < 1 || params.limit < 1) {
      throw new BadRequestException('page and limit must be positive integers');
    }
    return await this.customersRepository.list(params);
  }
}
