import { Injectable } from '@nestjs/common';
import { Customer } from '../domain/customer';

@Injectable()
export class CustomersRepository {
  // TODO: implementar con PrismaService una vez que tengamos database/ armado
  // y el modelo Customer definido en prisma/schema.prisma.
  // Esta clase traduce entre las filas de la base (Prisma) y la entidad de dominio (Customer).

  async findAll(): Promise<Customer[]> {
    return [];
  }

  async findById(id: string): Promise<Customer | null> {
    return null;
  }

  async save(customer: Customer): Promise<Customer> {
    return customer;
  }

  async delete(id: string): Promise<void> {}
}
