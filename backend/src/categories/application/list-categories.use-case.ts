import { Injectable } from '@nestjs/common';
import { Category } from '../domain/category';
import { CategoriesRepository } from '../domain/ports/categories.repository';

export type ListCategoriesInput = {
  page: number;
  limit: number;
};

@Injectable()
export class ListCategories {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(input: ListCategoriesInput): Promise<Category[]> {
    return this.repo.findAll(input.page, input.limit);
  }
}
