import { Body, Controller, Get, Param, Patch, Post, Query, UseFilters } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../../shared/domain/authenticated-user';
import { CurrentUser, RequirePermissions } from '../../../../../shared/http/auth/auth.decorators';
import { ModifyProcessType } from '../../../core/application/use-cases/modify-process-type.use-case';
import { GetProcessTypeById } from '../../../core/application/use-cases/get-process-type-by-id.use-case';
import { GetProcessTypeHistory } from '../../../core/application/use-cases/get-process-type-history.use-case';
import { ListProcessTypes } from '../../../core/application/use-cases/list-process-types.use-case';
import { RegisterProcessType } from '../../../core/application/use-cases/register-process-type.use-case';
import { ParseIntegerPathPipe } from '../../../../../shared/http/parse-integer-path.pipe';
import { ListProcessTypesRequestDto } from '../dto/list-process-types.request.dto';
import { RegisterProcessTypeRequestDto } from '../dto/register-process-type.request.dto';
import { UpdateProcessTypeRequestDto } from '../dto/update-process-type.request.dto';
import { TechnicalCatalogDomainErrorFilter } from '../filters/technical-catalog-domain-error.filter';
import { ProcessTypeHistoryResponse, ProcessTypeHistoryResponseBody } from '../process-type-history.response';
import { ProcessTypeListResponse, ProcessTypeListResponseBody } from '../process-type-list.response';
import { ProcessTypeResponse, ProcessTypeResponseBody } from '../process-type.response';

const PROCESS_TYPE_ID = new ParseIntegerPathPipe('processTypeId', 'El identificador del tipo de proceso no es válido.');

/** Tipos de proceso (contrato §3.4). Rol requerido: AT o EC, que comparten el permiso `process-type:manage`. */
@Controller('process-types')
@RequirePermissions('process-type:manage')
@UseFilters(TechnicalCatalogDomainErrorFilter)
export class ProcessTypesController {
  constructor(
    private readonly registerProcessType: RegisterProcessType,
    private readonly listProcessTypes: ListProcessTypes,
    private readonly getProcessTypeById: GetProcessTypeById,
    private readonly getProcessTypeHistory: GetProcessTypeHistory,
    private readonly modifyProcessType: ModifyProcessType,
  ) {}

  /** El autor del cambio, para el historial de precios (RNF10), es el usuario de la sesión. */
  @Patch(':processTypeId')
  async modify(
    @Param('processTypeId', PROCESS_TYPE_ID) id: number,
    @Body() body: UpdateProcessTypeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProcessTypeResponseBody> {
    return ProcessTypeResponse.from(await this.modifyProcessType.execute({ id, changes: body, authorId: user.userId }));
  }

  /** Quien registra el tipo de proceso queda como su creador: es el usuario de la sesión. */
  @Post()
  async register(
    @Body() body: RegisterProcessTypeRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ProcessTypeResponseBody> {
    return ProcessTypeResponse.from(await this.registerProcessType.execute({ ...body, authorId: user.userId }));
  }

  @Get()
  async list(@Query() query: ListProcessTypesRequestDto): Promise<ProcessTypeListResponseBody> {
    const result = await this.listProcessTypes.execute(query);
    return ProcessTypeListResponse.from(result, query.page, query.limit);
  }

  @Get(':processTypeId')
  async getById(@Param('processTypeId', PROCESS_TYPE_ID) id: number): Promise<ProcessTypeResponseBody> {
    return ProcessTypeResponse.from(await this.getProcessTypeById.execute(id));
  }

  @Get(':processTypeId/history')
  async history(@Param('processTypeId', PROCESS_TYPE_ID) id: number): Promise<ProcessTypeHistoryResponseBody> {
    return ProcessTypeHistoryResponse.from(await this.getProcessTypeHistory.execute(id));
  }
}
