import { Injectable } from '@nestjs/common';
import { Category } from '../domain/category';
import { CategoriesRepository } from '../domain/ports/categories.repository';
import { CategoryNameAlreadyExists } from '../domain/errors/category-already-exists.error';
import { CategoryNameTakenByInactive } from '../domain/errors/category-name-taken-by-inactive.error';

export type CreateCategoryInput = {
  name: string;
};

@Injectable()
export class CreateCategory {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(input: CreateCategoryInput): Promise<Category> {
    const existing = await this.repo.findByName(input.name);

    if (existing) {
      if (existing.getActive()) {
        throw new CategoryNameAlreadyExists(input.name);
      }
      throw new CategoryNameTakenByInactive(input.name, existing.getId() as number);
    }

    const category = Category.create(input.name);
    return this.repo.save(category);
  }
}
