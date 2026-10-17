import { Body, Controller, Get, Param, Post, Query, UseFilters } from '@nestjs/common';
import { parseIdPipe } from '../../../../../shared/http/parse-id.pipe';
import { CreateUser } from '../../../core/application/use-cases/create-user.use-case';
import { GetUserById } from '../../../core/application/use-cases/get-user-by-id.use-case';
import { ListUsers } from '../../../core/application/use-cases/list-users.use-case';
import { EmployeeQuery } from '../../../core/domain/ports/employee-query.port';
import { CreateUserDto } from '../dto/create-user.dto';
import { ListUsersQueryDto } from '../dto/list-users-query.dto';
import { DomainErrorFilter } from '../filters/domain-error.filter';
import { UserListResponse, UserResponse, toUserResponse } from '../mappers/user.mapper';

/**
 * CU-05/CU-07. x-roles: AS (ver docs/openapi/paths/users.yaml) — no hay
 * ningún guard todavía que lo haga cumplir en runtime (depende de CU-53,
 * el login, que no existe). Queda como regla documentada, no aplicada.
 *
 * Inyecta EmployeeQuery directo (no solo los casos de uso) porque la
 * respuesta HTTP necesita nombre/apellido del empleado, que no vive en
 * User. Sin un adaptador real de EmployeeQuery registrado en algún módulo
 * importado, Nest no puede resolver este controller — esperado hasta que
 * employees exista (mismo camino que categories/factory).
 */
@Controller('users')
@UseFilters(DomainErrorFilter)
export class UsersController {
  constructor(
    private readonly createUser: CreateUser,
    private readonly getUserById: GetUserById,
    private readonly listUsers: ListUsers,
    private readonly employeeQuery: EmployeeQuery,
  ) {}

  @Post()
  async create(@Body() body: CreateUserDto): Promise<UserResponse> {
    const user = await this.createUser.execute(body);
    // El empleado ya se validó dentro de CreateUser; si no apareciera acá
    // sería una inconsistencia de datos, no un caso de negocio a manejar.
    const employee = await this.employeeQuery.findEmployee(user.getEmployeeId());
    return toUserResponse(user, employee!);
  }

  @Get()
  async list(@Query() query: ListUsersQueryDto): Promise<UserListResponse> {
    const { items, total } = await this.listUsers.execute(query);

    // TODO(employees): un findEmployee por usuario es N+1. Revisar cuando
    // EmployeeQuery tenga una variante en lote.
    const responses = await Promise.all(
      items.map(async (user) => {
        const employee = await this.employeeQuery.findEmployee(user.getEmployeeId());
        return toUserResponse(user, employee!);
      }),
    );

    return { items: responses, total, page: query.page, limit: query.limit };
  }

  @Get(':id')
  async getById(
    @Param('id', parseIdPipe('userId', 'El identificador del usuario no es válido.')) id: number,
  ): Promise<UserResponse> {
    const user = await this.getUserById.execute(id);
    const employee = await this.employeeQuery.findEmployee(user.getEmployeeId());
    return toUserResponse(user, employee!);
  }
}
