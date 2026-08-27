import { Injectable } from '@nestjs/common';
import { Category } from '../domain/category';
import { CategoriesRepository } from '../infrastructure/categories.repository';
import { CreateCategoryDto } from '../http/dto/create-category.dto';
import { UpdateCategoryDto } from '../http/dto/update-category.dto';

//esta clase se puede inyectar como dependencia en otro lado. Nest sabe como crear una instancia de CategoriesService para dársela al controller.
@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  create(dto: CreateCategoryDto): Promise<Category> {  // esto representa "voy a tardar en conseguir el dato"
    const category = Category.create(dto.name);
    return this.categoriesRepository.save(category);
  }

  findAll(page: number, limit: number): Promise<Category[]> {
    return this.categoriesRepository.findAll(page, limit);
  }

  findOne(id: number): Promise<Category | null> {
    return this.categoriesRepository.findById(id);
  }

  async update(id: number, dto: UpdateCategoryDto): Promise<Category | null> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) return null;
    if (dto.name) category.rename(dto.name);
    return this.categoriesRepository.save(category);
  }

  async remove(id: number): Promise<Category | null> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) return null;
    category.deactivate();
    return this.categoriesRepository.save(category);
  }
}
