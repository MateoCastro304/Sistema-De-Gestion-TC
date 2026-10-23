import { Body, Controller, Get, Param, Patch, Post, Query, UseFilters, UseGuards } from '@nestjs/common';
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
import { AuthorId } from '../guards/author-id.decorator';
import { ProvisionalAuthorGuard } from '../guards/provisional-author.guard';
import { ProcessTypeHistoryResponse, ProcessTypeHistoryResponseBody } from '../process-type-history.response';
import { ProcessTypeListResponse, ProcessTypeListResponseBody } from '../process-type-list.response';
import { ProcessTypeResponse, ProcessTypeResponseBody } from '../process-type.response';

const PROCESS_TYPE_ID = new ParseIntegerPathPipe('processTypeId', 'El identificador del tipo de proceso no es válido.');

/**
 * Tipos de proceso (contrato §3.4). Rol requerido: AT o EC. Todavía no hay
 * autenticación ni guards (identity sin implementar, DA-04): cuando existan,
 * el guard de roles se aplica acá.
 */
@Controller('process-types')
@UseFilters(TechnicalCatalogDomainErrorFilter)
export class ProcessTypesController {
  constructor(
    private readonly registerProcessType: RegisterProcessType,
    private readonly listProcessTypes: ListProcessTypes,
    private readonly getProcessTypeById: GetProcessTypeById,
    private readonly getProcessTypeHistory: GetProcessTypeHistory,
    private readonly modifyProcessType: ModifyProcessType,
  ) {}

  /**
   * El autor del cambio sale del guard provisorio (header X-User-Id) hasta que
   * exista la sesión; en ese momento se reemplaza por el guard de autenticación.
   */
  @Patch(':processTypeId')
  @UseGuards(ProvisionalAuthorGuard)
  async modify(
    @Param('processTypeId', PROCESS_TYPE_ID) id: number,
    @Body() body: UpdateProcessTypeRequestDto,
    @AuthorId() authorId: number,
  ): Promise<ProcessTypeResponseBody> {
    return ProcessTypeResponse.from(await this.modifyProcessType.execute({ id, changes: body, authorId }));
  }

  @Post()
  async register(@Body() body: RegisterProcessTypeRequestDto): Promise<ProcessTypeResponseBody> {
    return ProcessTypeResponse.from(await this.registerProcessType.execute(body));
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
