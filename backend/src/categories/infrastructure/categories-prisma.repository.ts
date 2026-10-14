import { Injectable } from '@nestjs/common';
import { Category as CategoryRow } from '../../generated/prisma/client';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { Category } from '../domain/category';
import { CategoriesRepository, CategoryListParams, CategoryListResult } from '../domain/ports/categories.repository';

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
  async list(params: CategoryListParams): Promise<CategoryListResult> {
    const where = {
      isActive: true,
      ...(params.nameContains ? { name: { contains: params.nameContains, mode: 'insensitive' as const } } : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.category.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
      }),
      this.prisma.category.count({ where }),
    ]);

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  // Sin distinguir mayúsculas ni espacios de los extremos, como el repositorio en memoria.
  async findByName(name: string): Promise<Category | null> {
    const row = await this.prisma.category.findFirst({
      where: { name: { equals: name.trim(), mode: 'insensitive' } },
    });
    return row ? this.toDomain(row) : null;
  }

  // El "!" asume que la fila tiene name: si la DB tiene un name null (hoy la
  // columna es nullable en el schema), esto falla hasta que se resuelva esa
  // decisión (volver la columna NOT NULL).
  private toDomain(row: CategoryRow): Category {
    return Category.reconstruct(row.id, row.name!, row.isActive, row.createdAt, row.updatedAt);
  }
}
