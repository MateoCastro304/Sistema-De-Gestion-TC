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
import { FactoriesService } from '../application/factory.service';
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


@Controller('fabricas')
@UseFilters(FactoryExceptionFilter)
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: factoryValidationExceptionFactory,
  }),
)
export class FactoryController {

  constructor(private readonly factoriesService: FactoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createDto: CreateFactoryDto) {
    const factory = await this.factoriesService.create(createDto);
    return FactoryResponseDto.fromDomain(factory);
  }


  @Get()
async findAll(
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
) {
  const { items, total } = await this.factoriesService.list({ page, limit });
  return {
    items: items.map((factory) => FactoryResponseDto.fromDomain(factory)),
    total,
    page,
    limit,
  };
}



  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const factory = await this.factoriesService.findById(id);
    return FactoryResponseDto.fromDomain(factory);
  }


  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateFactoryDto,
  ) {
    const factory = await this.factoriesService.update(id, updateDto);
    return FactoryResponseDto.fromDomain(factory);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id', ParseIntPipe) id: number) {
    await this.factoriesService.deactivate(id);
  }

  @Patch(':id/activate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async activate(@Param('id', ParseIntPipe) id: number) {
    await this.factoriesService.activate(id);
  }
}