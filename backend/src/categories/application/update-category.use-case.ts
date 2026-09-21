import { Injectable } from '@nestjs/common';
import { Category } from '../domain/category';
import { CategoriesRepository } from '../domain/ports/categories.repository';
import { CategoryNotFound } from '../domain/errors/category-not-found.error';
import { CategoryInactive } from '../domain/errors/category-inactive.error';
import { CategoryNameAlreadyExists } from '../domain/errors/category-already-exists.error';

export type UpdateCategoryInput = {
  name?: string;
};

@Injectable()
export class UpdateCategory {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(id: number, input: UpdateCategoryInput): Promise<Category> {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new CategoryNotFound(id);
    }

    if (input.name !== undefined) {
      if (!category.getActive()) {
        throw new CategoryInactive(id);
      }

      const existing = await this.repo.findByName(input.name);
      if (existing && existing.getId() !== id) {
        throw new CategoryNameAlreadyExists(input.name);
      }

      category.rename(input.name);
    }

    return this.repo.save(category);
  }
}
