import { Injectable } from '@nestjs/common';
import { Supplier } from '../domain/supplier';

@Injectable()
export class SuppliersRepository {
  // TODO: implementar con PrismaService una vez que tengamos database/ armado
  // y el modelo Supplier definido en prisma/schema.prisma.

  async findAll(): Promise<Supplier[]> {
    return [];
  }

  async findById(id: string): Promise<Supplier | null> {
    return null;
  }

  async save(supplier: Supplier): Promise<Supplier> {
    return supplier;
  }

  async delete(id: string): Promise<void> {}
}
