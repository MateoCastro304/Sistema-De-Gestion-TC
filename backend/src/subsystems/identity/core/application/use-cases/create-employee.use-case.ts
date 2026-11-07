import { Injectable } from '@nestjs/common';
import { Employee, EmployeeInput } from '../../domain/entities/employee.entity';
import { EmployeeDniTaken } from '../../domain/errors/employee-dni-taken.error';
import { EmployeeRepository } from '../../domain/ports/employee.repository';

/**
 * Registra un empleado (CU-45). Primero valida los datos (400) y recién después
 * mira que el DNI no esté usado (409). Nace activo. No avisa de homónimos (D-18).
 * Guarda quién lo dio de alta (D-43): el usuario de la sesión.
 */
@Injectable()
export class CreateEmployee {
  constructor(private readonly repo: EmployeeRepository) {}

  async execute(input: EmployeeInput, createdByUserId: number): Promise<Employee> {
    const employee = Employee.create(input, createdByUserId);

    if (await this.repo.existsByDni(employee.getDni())) {
      throw new EmployeeDniTaken(employee.getDni());
    }

    return await this.repo.save(employee);
  }
}
