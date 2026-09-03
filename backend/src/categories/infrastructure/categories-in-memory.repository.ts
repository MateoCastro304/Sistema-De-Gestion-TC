import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../domain/categories.repository';
import { Category } from '../domain/category';

@Injectable()
export class CategoriesInMemoryRepository implements CategoriesRepository {
  private readonly categories: Map<number, Category> = new Map();
  private autoIncrementId = 1;


    async findAll(page: number, limit: number): Promise<Category[]> {
    const active = Array.from(this.categories.values()).filter((c) => c.getActive());
    const start = (page - 1) * limit;
    return active.slice(start, start + limit);
  }

  async findById(id: number): Promise<Category | null> {
    return this.categories.get(id) ?? null;
  }

  async save(category: Category): Promise<Category> {
    const id = category.getId();
    if (id === null) {
      const generatedId = this.autoIncrementId++;
      const saved = Category.reconstitute(
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