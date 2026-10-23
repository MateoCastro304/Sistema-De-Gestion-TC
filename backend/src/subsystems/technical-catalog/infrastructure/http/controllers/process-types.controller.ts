import { Body, Controller, Post, UseFilters } from '@nestjs/common';
import { RegisterProcessType } from '../../../core/application/use-cases/register-process-type.use-case';
import { TechnicalCatalogDomainErrorFilter } from '../filters/technical-catalog-domain-error.filter';
import { RegisterProcessTypeRequestDto } from '../dto/register-process-type.request.dto';
import { ProcessTypeResponse, ProcessTypeResponseBody } from '../process-type.response';

/**
 * Tipos de proceso (contrato §3.4). Rol requerido: AT o EC. Todavía no hay
 * autenticación ni guards (identity sin implementar, DA-04): cuando existan,
 * el guard de roles se aplica acá.
 */
@Controller('process-types')
@UseFilters(TechnicalCatalogDomainErrorFilter)
export class ProcessTypesController {
  constructor(private readonly registerProcessType: RegisterProcessType) {}

  @Post()
  async register(@Body() body: RegisterProcessTypeRequestDto): Promise<ProcessTypeResponseBody> {
    return ProcessTypeResponse.from(await this.registerProcessType.execute(body));
  }
}
