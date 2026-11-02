import { Injectable } from '@nestjs/common';
import { EmployeeRepository } from '../../employees/core/domain/ports/employee.repository';
import { EmployeeQuery, EmployeeSummary } from '../core/domain/ports/employee-query.port';

@Injectable()
export class EmployeeQueryAdapter implements EmployeeQuery {
  constructor(private readonly employeeRepository: EmployeeRepository) {}

  async findEmployee(employeeId: number): Promise<EmployeeSummary | null> {
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) return null;

    return {
      id: employee.getId() as number,
      firstName: employee.getFirstName(),
      lastName: employee.getLastName(),
      active: employee.isActive(),
    };
  }
}
