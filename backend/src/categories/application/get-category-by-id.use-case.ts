import { Injectable } from '@nestjs/common';
import { Category } from '../domain/category';
import { CategoriesRepository } from '../domain/ports/categories.repository';
import { CategoryNotFound } from '../domain/errors/category-not-found.error';

@Injectable()
export class GetCategoryById {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(id: number): Promise<Category> {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new CategoryNotFound(id);
    }
    return category;
  }
}
