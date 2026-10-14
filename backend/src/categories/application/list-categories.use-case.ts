import { Injectable } from '@nestjs/common';
import { CategoriesRepository, CategoryListParams, CategoryListResult } from '../domain/ports/categories.repository';

export type ListCategoriesInput = CategoryListParams;

@Injectable()
export class ListCategories {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(input: ListCategoriesInput): Promise<CategoryListResult> {
    return this.repo.list(input);
  }
}
