import { Body, Controller, Get, Param, Post, Query, UseFilters } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../../shared/domain/authenticated-user';
import { CurrentUser, RequirePermissions } from '../../../../../shared/http/auth/auth.decorators';
import { ParseIntegerPathPipe } from '../../../../../shared/http/parse-integer-path.pipe';
import { CreateEmployee } from '../../../core/application/use-cases/create-employee.use-case';
import { GetEmployeeById } from '../../../core/application/use-cases/get-employee-by-id.use-case';
import { ListEmployees } from '../../../core/application/use-cases/list-employees.use-case';
import { CreateEmployeeRequestDto } from '../dto/create-employee.request.dto';
import { ListEmployeesRequestDto, toListEmployeesParams } from '../dto/list-employees.request.dto';
import {
  EmployeeListResponse,
  EmployeeListResponseBody,
  EmployeeResponse,
  EmployeeResponseBody,
} from '../employee.response';
import { EmployeesExceptionFilter } from '../filters/employees-exception.filter';

const EMPLOYEE_ID = new ParseIntegerPathPipe('employeeId', 'El identificador del empleado no es válido.');

/**
 * Empleados (contrato §3.2). Rol requerido: AS, que es quien tiene el permiso
 * `employee:manage`. Sin ese permiso, el guard global responde 403.
 */
@Controller('employees')
@RequirePermissions('employee:manage')
@UseFilters(EmployeesExceptionFilter)
export class EmployeesController {
  constructor(
    private readonly createEmployee: CreateEmployee,
    private readonly getEmployeeById: GetEmployeeById,
    private readonly listEmployees: ListEmployees,
  ) {}

  @Post()
  async create(
    @Body() body: CreateEmployeeRequestDto,
    @CurrentUser() author: AuthenticatedUser,
  ): Promise<EmployeeResponseBody> {
    return EmployeeResponse.from(await this.createEmployee.execute(body, author.userId));
  }

  @Get()
  async list(@Query() query: ListEmployeesRequestDto): Promise<EmployeeListResponseBody> {
    const params = toListEmployeesParams(query);
    return EmployeeListResponse.from(await this.listEmployees.execute(params), params.page, params.limit);
  }

  @Get(':employeeId')
  async getById(@Param('employeeId', EMPLOYEE_ID) id: number): Promise<EmployeeResponseBody> {
    return EmployeeResponse.from(await this.getEmployeeById.execute(id));
  }
}
