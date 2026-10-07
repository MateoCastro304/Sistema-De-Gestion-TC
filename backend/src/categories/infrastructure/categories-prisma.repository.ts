import { Injectable } from '@nestjs/common';
import { Category as CategoryRow } from '@prisma/client';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { Category } from '../domain/category';
import { CategoriesRepository } from '../domain/ports/categories.repository';

@Injectable()
export class CategoriesPrismaRepository implements CategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(category: Category): Promise<Category> {
    const id = category.getId();

    if (id === null) {
      const row = await this.prisma.category.create({
        data: { name: category.getName(), isActive: category.getActive() },
      });
      return this.toDomain(row);
    }

    const row = await this.prisma.category.update({
      where: { id },
      data: { name: category.getName(), isActive: category.getActive() },
    });
    return this.toDomain(row);
  }

  async findById(id: number): Promise<Category | null> {
    const row = await this.prisma.category.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  // Solo rubros activos, como el repositorio en memoria.
  async findAll(page: number, limit: number): Promise<Category[]> {
    const rows = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { id: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return rows.map((row) => this.toDomain(row));
  }

  // Sin distinguir mayúsculas ni espacios de los extremos, como el repositorio en memoria.
  async findByName(name: string): Promise<Category | null> {
    const row = await this.prisma.category.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
    });
    return row ? this.toDomain(row) : null;
  }

  private toDomain(row: CategoryRow): Category {
    return Category.reconstruct(
      row.id,
      row.name ?? '',
      row.isActive,
      row.createdAt,
      row.updatedAt,
    );
  }
}
