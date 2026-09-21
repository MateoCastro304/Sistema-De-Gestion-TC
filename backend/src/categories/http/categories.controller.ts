import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  DefaultValuePipe,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseFilters,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { toCategoryResponse } from './mappers/category.mapper';
import { ValidationError } from 'class-validator';
import { DomainErrorFilter } from './filters/domain-error.filter';
import { CreateCategory } from '../application/create-category.use-case';
import { GetCategoryById } from '../application/get-category-by-id.use-case';
import { ListCategories } from '../application/list-categories.use-case';
import { UpdateCategory } from '../application/update-category.use-case';
import { DeactivateCategory } from '../application/deactivate-category.use-case';
import { ActivateCategory } from '../application/activate-category.use-case';

function categoryValidationExceptionFactory(errors: ValidationError[]) {
  const details = errors.map((error) => ({
    field: error.property,
    message: Object.values(error.constraints ?? {})[0] ?? 'Invalid value.',
  }));
  return new BadRequestException({ message: 'Invalid request data.', details });
}

@Controller('categories')
@UseFilters(DomainErrorFilter)
@UsePipes(
  new ValidationPipe({
    transform: true, // convierta el objeto plano que llega (JSON crudo) en una instancia real de la clase DTO correspondient
    whitelist: true,
    exceptionFactory: categoryValidationExceptionFactory,
  }),
)
export class CategoriesController {
  constructor(
    private readonly createCategory: CreateCategory,
    private readonly getCategoryById: GetCategoryById,
    private readonly listCategories: ListCategories,
    private readonly updateCategory: UpdateCategory,
    private readonly deactivateCategory: DeactivateCategory,
    private readonly activateCategory: ActivateCategory,
  ) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.createCategory.execute(createCategoryDto);
    return {
      message: 'Rubro registrado correctamente',
      category: toCategoryResponse(category),
    };
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const categories = await this.listCategories.execute({ page, limit });
    return categories.map(toCategoryResponse);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.getCategoryById.execute(id);
    return toCategoryResponse(category);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    const category = await this.updateCategory.execute(id, updateCategoryDto);
    return toCategoryResponse(category);
  }

  @Patch(':id/restore')
  async restore(@Param('id', ParseIntPipe) id: number) {
    const category = await this.activateCategory.execute(id);
    return toCategoryResponse(category);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const category = await this.deactivateCategory.execute(id);
    return toCategoryResponse(category);
  }
}
