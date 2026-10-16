import { Injectable } from '@nestjs/common';
import {
  CategoriesRepository,
  CategoryListParams,
  CategoryListResult,
} from '../../../core/domain/ports/categories.repository';
import { Category } from '../../../core/domain/entities/category';

@Injectable()
export class CategoriesInMemoryRepository implements CategoriesRepository {
  private readonly categories: Map<number, Category> = new Map();
  private autoIncrementId = 1;

  async list(params: CategoryListParams): Promise<CategoryListResult> {
    const wanted = params.active ?? true;
    let filtered = Array.from(this.categories.values()).filter((c) => c.getActive() === wanted);

    if (params.nameContains) {
      const needle = params.nameContains.trim().toLowerCase();
      filtered = filtered.filter((c) => c.getName().toLowerCase().includes(needle));
    }

    const total = filtered.length;
    const start = (params.page - 1) * params.limit;
    const items = filtered.slice(start, start + params.limit);

    return { items, total };
  }

  async findById(id: number): Promise<Category | null> {
    return this.categories.get(id) ?? null;
  }

  async findByName(name: string): Promise<Category | null> {
    const normalized = name.trim().toLowerCase();
    const found = Array.from(this.categories.values()).find((c) => c.getName().trim().toLowerCase() === normalized);
    return found ?? null;
  }

  async save(category: Category): Promise<Category> {
    const id = category.getId();
    if (id === null) {
      const generatedId = this.autoIncrementId++;
      const saved = Category.reconstruct(
        generatedId,
        category.getName(),
        category.getActive(),
        category.getCreatedAt(),
        category.getUpdatedAt(),
      );
      this.categories.set(generatedId, saved);
      return saved;
    }
    this.categories.set(id, category);
    return category;
  }
}
