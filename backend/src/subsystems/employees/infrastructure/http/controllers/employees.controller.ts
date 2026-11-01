import { Body, Controller, Get, Param, Post, Query, UseFilters } from '@nestjs/common';
import { CreateEmployee } from '../../../core/application/use-cases/create-employee.use-case';
import { GetEmployeeById } from '../../../core/application/use-cases/get-employee-by-id.use-case';
import { ListEmployees } from '../../../core/application/use-cases/list-employees.use-case';
import { InvalidEmployeeId } from '../../../core/domain/errors/invalid-employee-id.error';
import { CreateEmployeeDto } from '../dto/create-employee.dto';
import { ListEmployeesQueryDto, toListEmployeesParams } from '../dto/list-employees-query.dto';
import { EmployeesExceptionFilter } from '../filters/employees-exception.filter';
import { EmployeeListResponse, EmployeeResponse, toEmployeeResponse } from '../mappers/employee.mapper';

const MAX_EMPLOYEE_ID = 2_147_483_647;

function parseEmployeeId(raw: string): number {
  const id = /^\d+$/.test(raw) ? Number(raw) : NaN;
  if (!Number.isSafeInteger(id) || id > MAX_EMPLOYEE_ID) {
    throw new InvalidEmployeeId();
  }
  return id;
}


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
  async getById(@Param('employeeId') rawId: string): Promise<EmployeeResponse> {
    const employee = await this.getEmployeeById.execute(parseEmployeeId(rawId));
    return toEmployeeResponse(employee);
  }
}
