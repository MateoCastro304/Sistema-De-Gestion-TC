import { BadRequestException, Injectable } from '@nestjs/common';
import { isValidPage, PAGE_LIMIT_ERROR } from '../../shared/domain/pagination';
import { CategoriesRepository, CategoryListParams, CategoryListResult } from '../domain/ports/categories.repository';

export type ListCategoriesInput = CategoryListParams;

@Injectable()
export class ListCategories {
  constructor(private readonly repo: CategoriesRepository) {}

  async execute(input: ListCategoriesInput): Promise<CategoryListResult> {
    if (!isValidPage(input.page, input.limit)) {
      throw new BadRequestException(PAGE_LIMIT_ERROR);
    }
    return this.repo.list(input);
  }
}
