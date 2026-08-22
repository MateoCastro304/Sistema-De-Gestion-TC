import { Injectable } from '@nestjs/common';
import { Category } from '../domain/category';
import { CategoriesRepository } from '../infrastructure/categories.repository';
import { CreateCategoryDto } from '../http/dto/create-category.dto';
import { UpdateCategoryDto } from '../http/dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly categoriesRepository: CategoriesRepository) {}

  create(dto: CreateCategoryDto): Promise<Category> {
    const category = new Category('temp-id', dto.name);
    return this.categoriesRepository.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepository.findAll();
  }

  findOne(id: string): Promise<Category | null> {
    return this.categoriesRepository.findById(id);
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category | null> {
    const category = await this.categoriesRepository.findById(id);
    if (!category) return null;
    if (dto.name) category.rename(dto.name);
    return this.categoriesRepository.save(category);
  }

  remove(id: string): Promise<void> {
    return this.categoriesRepository.delete(id);
  }
}
