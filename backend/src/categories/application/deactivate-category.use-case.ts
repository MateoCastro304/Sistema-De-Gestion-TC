import { ConflictException, Injectable } from '@nestjs/common';
import { Category } from '../domain/category';
import { CategoriesRepository } from '../domain/ports/categories.repository';
import { CategoryNotFound } from '../domain/errors/category-not-found.error';
import { CategoryHasActiveFactories } from '../domain/errors/category-has-active-factories.error';
import { FactoryQuery } from '../domain/ports/factory-query.port';

@Injectable()
export class DeactivateCategory {
  constructor(
    private readonly repo: CategoriesRepository,
    private readonly factoryQuery?: FactoryQuery,
  ) {}

  async execute(id: number): Promise<Category> {
    const category = await this.repo.findById(id);
    if (!category) {
      throw new CategoryNotFound(id);
    }

    if (this.factoryQuery) {
      const activeFactories = await this.factoryQuery.getActiveFactoriesForCategory(id);
      if (activeFactories.length > 0) {
        const error = new CategoryHasActiveFactories(id, activeFactories);
        throw new ConflictException({ message: error.message, factories: error.factories });
      }
    }

    category.deactivate();
    return this.repo.save(category);
  }
}
