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
import { CreateFactory } from '../../../core/application/use-cases/create-factory.use-case';
import { GetFactoryById } from '../../../core/application/use-cases/get-factory-by-id.use-case';
import { ListFactories } from '../../../core/application/use-cases/list-factories.use-case';
import { UpdateFactory } from '../../../core/application/use-cases/update-factory.use-case';
import { DeactivateFactory } from '../../../core/application/use-cases/deactivate-factory.use-case';
import { CreateFactoryDto } from '../dto/create-factory.dto';
import { UpdateFactoryDto } from '../dto/update-factory.dto';
import { FactoryResponseDto } from '../dto/factory-response.dto';
import { FactoryExceptionFilter } from '../filters/factory-exception.filter';

@Controller('factories')
@UseFilters(FactoryExceptionFilter)
export class FactoryController {
  constructor(
    private readonly createFactory: CreateFactory,
    private readonly getFactoryById: GetFactoryById,
    private readonly listFactories: ListFactories,
    private readonly updateFactory: UpdateFactory,
    private readonly deactivateFactory: DeactivateFactory,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateFactoryDto) {
    const factory = await this.createFactory.execute(createDto);
    return FactoryResponseDto.fromDomain(factory);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('categoryId', new ParseIntPipe({ optional: true })) categoryId?: number,
    @Query('nameContains') nameContains?: string,
    @Query('active', new ParseBoolPipe({ optional: true })) active?: boolean,
  ) {
    const { items, total } = await this.listFactories.execute({
      page,
      limit,
      categoryId,
      nameContains,
      active,
    });
    return {
      items: items.map((factory) => FactoryResponseDto.fromDomain(factory)),
      total,
      page,
      limit,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const factory = await this.getFactoryById.execute(id);
    return FactoryResponseDto.fromDomain(factory);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateDto: UpdateFactoryDto) {
    const factory = await this.updateFactory.execute(id, updateDto);
    return FactoryResponseDto.fromDomain(factory);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    await this.deactivateFactory.execute(id);
  }
}
