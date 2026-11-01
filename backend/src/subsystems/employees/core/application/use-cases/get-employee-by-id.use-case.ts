import { Injectable } from '@nestjs/common';
import { Employee } from '../../domain/entities/employee';
import { EmployeeNotFound } from '../../domain/errors/employee-not-found.error';
import { EmployeeRepository } from '../../domain/ports/employee.repository';


@Injectable()
export class GetEmployeeById {
  constructor(private readonly repo: EmployeeRepository) {}

  async execute(id: number): Promise<Employee> {
    const employee = await this.repo.findById(id);
    if (employee === null) {
      throw new EmployeeNotFound(id);
    }
    return employee;
  }
}
