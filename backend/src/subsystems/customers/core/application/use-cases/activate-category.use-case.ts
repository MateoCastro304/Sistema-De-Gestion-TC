import { Injectable } from '@nestjs/common';
import { Category } from '../../domain/entities/category';
import { CategoriesRepository } from '../../domain/ports/categories.repository';
import { CategoryNotFound } from '../../domain/errors/category-not-found.error';

@Injectable()
export class ActivateCategory {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(id: number): Promise<Category> {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new CategoryNotFound(id);
    }
    category.activate();
    return this.repo.save(category);
  }
}
