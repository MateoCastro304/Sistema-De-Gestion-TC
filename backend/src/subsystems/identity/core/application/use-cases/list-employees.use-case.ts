import { Injectable } from '@nestjs/common';
import { EmployeeListParams, EmployeeListResult, EmployeeRepository } from '../../domain/ports/employee.repository';


@Injectable()
export class ListEmployees {
  constructor(private readonly repo: EmployeeRepository) {}

  async execute(params: EmployeeListParams): Promise<EmployeeListResult> {
    return await this.repo.list(params);
  }
}
