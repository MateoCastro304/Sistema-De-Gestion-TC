import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Factory as FactoryRow } from '@prisma/client';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { Factory } from '../domain/factory';
import {
  FactoryRepository,
  FactoryListParams,
  FactoryListResult,
} from '../domain/port/factory.repository';


@Injectable()
export class FactoryPrismaRepository implements FactoryRepository {
  constructor(private readonly prisma: PrismaService) {}

    async save(factory: Factory): Promise<Factory> {
    const row = await this.prisma.factory.create({
      data: {
        cuit: factory.getCuit(),
        name: factory.getName(),
        address: factory.getAddress(),
        payMethod: factory.getPaymentDescription(),
        categoryId: factory.getCategoryId(),
        isActive: factory.isActive(),
      },
    });
    return this.toDomain(row);
  }

  async findById(id: number): Promise<Factory | null> {
    const row = await this.prisma.factory.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Factory[]> {
    const rows = await this.prisma.factory.findMany({ orderBy: { id: 'asc' } });
    return rows.map((row) => this.toDomain(row));
  }

  async update(factory: Factory): Promise<void> {
    const id = factory.getId();
    if (!id) {
      throw new NotFoundException(`Factory with ID ${id} not found`);
    }

    try {
      await this.prisma.factory.update({
        where: { id },
        data: {
          cuit: factory.getCuit(),
          name: factory.getName(),
          address: factory.getAddress(),
          payMethod: factory.getPaymentDescription(),
          categoryId: factory.getCategoryId(),
          isActive: factory.isActive(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Factory with ID ${id} not found`);
      }
      throw error;
    }
  }

  async existsByCuit(cuit: string, excludeId?: number): Promise<boolean> {
    const count = await this.prisma.factory.count({
      where: {
        cuit,
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async list(params: FactoryListParams): Promise<FactoryListResult> {
    const { page, limit, categoryId, nameContains, active } = params;

    const where: Prisma.FactoryWhereInput = {
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(active !== undefined ? { isActive: active } : {}),
      ...(nameContains
        ? { name: { contains: nameContains, mode: 'insensitive' } }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.factory.findMany({
        where,
        orderBy: { id: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.factory.count({ where }),
    ]);

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  // TODO: quitar los "!" de cuit y categoryId cuando se aplique la migración (NOT NULL).
  private toDomain(row: FactoryRow): Factory {
    return Factory.reconstruct(
      row.id,
      row.cuit!,
      row.name,
      row.address,
      row.payMethod,
      row.categoryId!,
      row.isActive,
      row.createdAt,
      row.updatedAt,
    );
  }
}