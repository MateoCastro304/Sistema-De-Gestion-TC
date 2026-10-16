import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  ParseBoolPipe,
  UseFilters,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';

import { CreateManagerDto } from '../dto/create-manager.dto';
import { UpdateManagerDto } from '../dto/update-manager.dto';
import { CreateManager } from '../../../core/application/use-cases/create-manager.use-case';
import { GetManagerById } from '../../../core/application/use-cases/get-manager-by-id.use-case';
import { ListManagers } from '../../../core/application/use-cases/list-managers.use-case';
import { UpdateManager } from '../../../core/application/use-cases/update-manager.use-case';
import { DeactivateManager } from '../../../core/application/use-cases/deactivate-manager.use-case';
import { ManagerResponseDto } from '../dto/manager-response.dto';
import { ManagerExceptionFilter } from '../filters/managers-exception.filter';

@Controller()
@UseFilters(ManagerExceptionFilter)
export class ManagersController {
  constructor(
    private readonly createManager: CreateManager,
    private readonly getManagerById: GetManagerById,
    private readonly listManagers: ListManagers,
    private readonly updateManager: UpdateManager,
    private readonly deactivateManager: DeactivateManager,
  ) {}

  @Get('managers')
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('factoryId', new ParseIntPipe({ optional: true })) factoryId?: number,
    @Query('nameContains') nameContains?: string,
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
  ) {
    const { items, total } = await this.listManagers.execute({
      page,
      limit,
      factoryId,
      nameContains,
      active,
    });
    return {
      items: items.map((manager) => ManagerResponseDto.fromDomain(manager)),
      total,
      page,
      limit,
    };
  }

  @Get('factories/:factoryId/managers/:id')
  async findById(@Param('factoryId', ParseIntPipe) factoryId: number, @Param('id', ParseIntPipe) id: number) {
    const manager = await this.getManagerById.execute(factoryId, id);
    return ManagerResponseDto.fromDomain(manager);
  }

  @Post('factories/:factoryId/managers')
  @HttpCode(HttpStatus.CREATED)
  async create(@Param('factoryId', ParseIntPipe) factoryId: number, @Body() createDto: CreateManagerDto) {
    const manager = await this.createManager.execute(factoryId, createDto);
    return ManagerResponseDto.fromDomain(manager);
  }

  @Patch('factories/:factoryId/managers/:id')
  async update(
    @Param('factoryId', ParseIntPipe) factoryId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateManagerDto,
  ) {
    const manager = await this.updateManager.execute(factoryId, id, updateDto);
    return ManagerResponseDto.fromDomain(manager);
  }

  @Patch('factories/:factoryId/managers/:id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('factoryId', ParseIntPipe) factoryId: number, @Param('id', ParseIntPipe) id: number) {
    await this.deactivateManager.execute(factoryId, id);
  }
}
