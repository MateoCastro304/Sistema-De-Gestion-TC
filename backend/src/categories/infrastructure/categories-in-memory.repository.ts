import { Injectable } from '@nestjs/common';
import { CategoriesRepository } from '../domain/categories.repository';
import { Category } from '../domain/category';

@Injectable()
export class CategoriesInMemoryRepository implements CategoriesRepository {
  private readonly categories: Map<number, Category> = new Map();
  private autoIncrementId = 1;


    async findAll(page: number, limit: number): Promise<Category[]> {
    const active = Array.from(this.categories.values()).filter((c) => c.active);
    const start = (page - 1) * limit;
    return active.slice(start, start + limit);
  }

  async findById(id: number): Promise<Category | null> {
    return this.categories.get(id) ?? null;
  }

  async save(category: Category): Promise<Category> {
        if (category.id === null) {
      const generatedId = this.autoIncrementId++;
      const saved = Category.reconstitute(
        generatedId,
        category.name,
        category.active,
        category.createdAt,
        category.updatedAt,
      );
      this.categories.set(generatedId, saved);
      return saved;
    }
    this.categories.set(category.id, category);
    return category;
  }
}