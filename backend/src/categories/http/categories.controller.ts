import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Query, DefaultValuePipe } from '@nestjs/common';
import { CategoriesService } from '../application/categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { ValidationError } from 'class-validator';
import { CategoryExceptionFilter } from './filters/category-exception.filter';
import { BadRequestException, NotFoundException, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';

function categoryValidationExceptionFactory(errors: ValidationError[]) {
  const details = errors.map((error) => ({
    field: error.property,
    message: Object.values(error.constraints ?? {})[0] ?? 'Invalid value.',
  }));
  return new BadRequestException({ message: 'Invalid request data.', details });
}

@Controller('categories')
@UseFilters(CategoryExceptionFilter)
@UsePipes(
  new ValidationPipe({
    transform: true, // convierta el objeto plano que llega (JSON crudo) en una instancia real de la clase DTO correspondient
    whitelist: true,
    exceptionFactory: categoryValidationExceptionFactory,
  }),
)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const category = await this.categoriesService.create(createCategoryDto);
    return CategoryResponseDto.fromDomain(category);
  }

  @Get()
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    const categories = await this.categoriesService.findAll(page, limit);
    return categories.map((category) => CategoryResponseDto.fromDomain(category));
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.findOne(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} was not found.`);
    }
    return CategoryResponseDto.fromDomain(category);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoriesService.update(id, updateCategoryDto);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} was not found.`);
    }
    return CategoryResponseDto.fromDomain(category);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const category = await this.categoriesService.remove(id);
    if (!category) {
      throw new NotFoundException(`Category with id ${id} was not found.`);
    }
    return CategoryResponseDto.fromDomain(category);
  }
}