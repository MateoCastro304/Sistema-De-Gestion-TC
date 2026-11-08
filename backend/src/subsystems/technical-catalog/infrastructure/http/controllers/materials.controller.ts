import { Body, Controller, Get, Post, Query, UseFilters } from '@nestjs/common';
import type { AuthenticatedUser } from '../../../../../shared/domain/authenticated-user';
import { CurrentUser, RequirePermissions } from '../../../../../shared/http/auth/auth.decorators';
import { ListMaterialNames } from '../../../core/application/use-cases/list-material-names.use-case';
import { ListMaterials } from '../../../core/application/use-cases/list-materials.use-case';
import { RegisterMaterial } from '../../../core/application/use-cases/register-material.use-case';
import { ListMaterialsRequestDto } from '../dto/list-materials.request.dto';
import { RegisterMaterialRequestDto } from '../dto/register-material.request.dto';
import { MaterialDomainErrorFilter } from '../filters/material-domain-error.filter';
import {
  MaterialListResponse,
  MaterialListResponseBody,
  MaterialNamesResponse,
  MaterialNamesResponseBody,
  MaterialResponse,
  MaterialResponseBody,
} from '../material.response';

/** Materiales (contrato §3.6). Rol requerido: AT o EC, que comparten el permiso `material:manage`. */
@Controller('materials')
@RequirePermissions('material:manage')
@UseFilters(MaterialDomainErrorFilter)
export class MaterialsController {
  constructor(
    private readonly registerMaterial: RegisterMaterial,
    private readonly listMaterials: ListMaterials,
    private readonly listMaterialNames: ListMaterialNames,
  ) {}

  /** Quien registra el material queda como su creador: es el usuario de la sesión. */
  @Post()
  async register(
    @Body() body: RegisterMaterialRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MaterialResponseBody> {
    return MaterialResponse.from(await this.registerMaterial.execute({ ...body, authorId: user.userId }));
  }

  @Get()
  async list(@Query() query: ListMaterialsRequestDto): Promise<MaterialListResponseBody> {
    const result = await this.listMaterials.execute(query);
    return MaterialListResponse.from(result, query.page, query.limit);
  }

  @Get('names')
  async names(): Promise<MaterialNamesResponseBody> {
    return MaterialNamesResponse.from(await this.listMaterialNames.execute());
  }
}
