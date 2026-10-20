import { Injectable } from '@nestjs/common';
import { Employee, EmployeeInput } from '../../domain/entities/employee';
import { EmployeeDniTaken } from '../../domain/errors/employee-dni-taken.error';
import { EmployeeRepository } from '../../domain/ports/employee.repository';


@Injectable()
export class CreateEmployee {
  constructor(private readonly repo: EmployeeRepository) {}

  async execute(input: EmployeeInput): Promise<Employee> {
    const employee = Employee.create(input);

    if (await this.repo.existsByDni(employee.getDni())) {
      throw new EmployeeDniTaken(employee.getDni());
    }

    return await this.repo.save(employee);
  }
}
