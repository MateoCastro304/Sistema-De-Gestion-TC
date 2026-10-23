import { Module } from '@nestjs/common';
import { CreateEmployee } from '../core/application/use-cases/create-employee.use-case';
import { GetEmployeeById } from '../core/application/use-cases/get-employee-by-id.use-case';
import { ListEmployees } from '../core/application/use-cases/list-employees.use-case';
import { EmployeeRepository } from '../core/domain/ports/employee.repository';
import { EmployeesController } from './http/controllers/employees.controller';
import { EmployeePrismaRepository } from './persistence/prisma/employee-prisma.repository';

@Module({
  controllers: [EmployeesController],
  providers: [
    CreateEmployee,
    GetEmployeeById,
    ListEmployees,
    {
      provide: EmployeeRepository,
      useClass: EmployeePrismaRepository,
    },
  ],

  exports: [EmployeeRepository],
})
export class EmployeesModule {}
