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
  UsePipes,
  ValidationPipe,
  UseFilters,
  BadRequestException,
  Query,
  DefaultValuePipe,
} from '@nestjs/common';
import { CreateFactory } from '../application/create-factory.use-case';
import { GetFactoryById } from '../application/get-factory-by-id.use-case';
import { ListFactories } from '../application/list-factories.use-case';
import { UpdateFactory } from '../application/update-factory.use-case';
import { DeactivateFactory } from '../application/deactivate-factory.use-case';
import { CreateFactoryDto } from './dto/create-factory.dto';
import { UpdateFactoryDto } from './dto/update-factory.dto';
import { FactoryResponseDto } from './dto/factory-response.dto';
import { FactoryExceptionFilter } from './filters/factory-exception.filter';
import { ValidationError } from 'class-validator';

function factoryValidationExceptionFactory(errors: ValidationError[]) {
  const details = errors.map((error) => ({
    field: error.property,
    message: Object.values(error.constraints ?? {})[0] ?? 'Invalid value.',
  }));
  return new BadRequestException({ message: 'Invalid request data.', details });
}

@Controller('factories')
@UseFilters(FactoryExceptionFilter)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: factoryValidationExceptionFactory,
  }),
)
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
  ) {
    const { items, total } = await this.listFactories.execute({ page, limit });
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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFactoryDto,
  ) {
    const factory = await this.updateFactory.execute(id, updateDto);
    return FactoryResponseDto.fromDomain(factory);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    await this.deactivateFactory.execute(id);
  }
}
