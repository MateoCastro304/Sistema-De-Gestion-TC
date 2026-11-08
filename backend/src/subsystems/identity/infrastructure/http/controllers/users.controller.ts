import { Body, Controller, Get, Param, Post, Query, UseFilters } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../../shared/domain/authenticated-user';
import { CurrentUser, RequirePermissions } from '../../../../../shared/http/auth/auth.decorators';
import { ParseIntegerPathPipe } from '../../../../../shared/http/parse-integer-path.pipe';
import { CreateUser } from '../../../core/application/use-cases/create-user.use-case';
import { GetUserById } from '../../../core/application/use-cases/get-user-by-id.use-case';
import { ListUsers } from '../../../core/application/use-cases/list-users.use-case';
import { EmployeeRepository } from '../../../core/domain/ports/employee.repository';
import { CreateUserRequestDto } from '../dto/create-user.request.dto';
import { ListUsersRequestDto } from '../dto/list-users.request.dto';
import { UsersExceptionFilter } from '../filters/users-exception.filter';
import { UserListResponse, UserListResponseBody, UserResponse, UserResponseBody } from '../user.response';

const USER_ID = new ParseIntegerPathPipe('userId', 'El identificador del usuario no es válido.');

/**
 * Usuarios (CU-05/CU-07, contrato §3.3). Rol requerido: AS, que es quien tiene
 * el permiso `user:manage`. Sin ese permiso, el guard global responde 403.
 *
 * Inyecta EmployeeRepository directo (no solo los casos de uso) porque la
 * respuesta HTTP necesita nombre/apellido del empleado, que no vive en User.
 */
@Controller('users')
@RequirePermissions('user:manage')
@UseFilters(UsersExceptionFilter)
export class UsersController {
  constructor(
    private readonly createUser: CreateUser,
    private readonly getUserById: GetUserById,
    private readonly listUsers: ListUsers,
    private readonly employees: EmployeeRepository,
  ) {}

  @Post()
  async create(
    @Body() body: CreateUserRequestDto,
    @CurrentUser() author: AuthenticatedUser,
  ): Promise<UserResponseBody> {
    const user = await this.createUser.execute(body, author.userId);
    // El empleado ya se validó dentro de CreateUser; si no apareciera acá
    // sería una inconsistencia de datos, no un caso de negocio a manejar.
    const employee = await this.employees.findById(user.getEmployeeId());
    return UserResponse.from(user, employee!);
  }

  @Get()
  async list(@Query() query: ListUsersRequestDto): Promise<UserListResponseBody> {
    const result = await this.listUsers.execute(query);
    const employees = await this.employees.findByIds(result.items.map((user) => user.getEmployeeId()));

    return UserListResponse.from(result, employees, query.page, query.limit);
  }

  @Get(':userId')
  async getById(@Param('userId', USER_ID) userId: number): Promise<UserResponseBody> {
    const user = await this.getUserById.execute(userId);
    const employee = await this.employees.findById(user.getEmployeeId());
    return UserResponse.from(user, employee!);
  }
}
