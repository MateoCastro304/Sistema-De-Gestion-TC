import { Body, Controller, Get, Param, Post, Query, UseFilters } from '@nestjs/common';
import { CreateEmployee } from '../../../core/application/use-cases/create-employee.use-case';
import { GetEmployeeById } from '../../../core/application/use-cases/get-employee-by-id.use-case';
import { ListEmployees } from '../../../core/application/use-cases/list-employees.use-case';
import { ParseIntegerPathPipe } from '../../../../../shared/http/parse-integer-path.pipe';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { ListEmployeesQueryDto, toListEmployeesParams } from '../dto/list-employees-query.dto';
import { EmployeesExceptionFilter } from '../filters/employees-exception.filter';
import { EmployeeListResponse, EmployeeResponse, toEmployeeResponse } from '../mappers/employee.mapper';

const EMPLOYEE_ID = new ParseIntegerPathPipe('employeeId', 'El identificador del empleado no es válido.');

@Controller('employees')
@UseFilters(EmployeesExceptionFilter)
export class EmployeesController {
  constructor(
    private readonly createEmployee: CreateEmployee,
    private readonly getEmployeeById: GetEmployeeById,
    private readonly listEmployees: ListEmployees,
  ) {}

  @Post()
  async create(@Body() body: CreateEmployeeDto): Promise<EmployeeResponse> {
    const employee = await this.createEmployee.execute(body);
    return toEmployeeResponse(employee);
  }

  @Get()
  async list(@Query() query: ListEmployeesQueryDto): Promise<EmployeeListResponse> {
    const params = toListEmployeesParams(query);
    const { items, total } = await this.listEmployees.execute(params);
    return {
      items: items.map(toEmployeeResponse),
      total,
      page: params.page,
      limit: params.limit,
    };
  }

  @Get(':employeeId')
  async getById(@Param('employeeId', EMPLOYEE_ID) id: number): Promise<EmployeeResponse> {
    const employee = await this.getEmployeeById.execute(id);
    return toEmployeeResponse(employee);
  }
}
