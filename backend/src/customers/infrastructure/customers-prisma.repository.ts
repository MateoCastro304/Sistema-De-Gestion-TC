import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Customer as CustomerRow } from '@prisma/client';
import { PrismaService } from '../../shared/infrastructure/prisma/prisma.service';
import { Customer } from '../domain/customer';
import {
  CustomerRepository,
  CustomerListParams,
  CustomerListResult,
} from '../domain/port/customer.repository';

const MAX_ID_ATTEMPTS = 3;

@Injectable()
export class CustomerPrismaRepository implements CustomerRepository {
  constructor(private readonly prisma: PrismaService) {}

  // El id es correlativo por fábrica (lo hace el trigger en la DB). Prisma exige
  // el id en create(), así que se calcula max+1 de esa fábrica dentro de una
  // transacción. Si dos altas simultáneas chocan, la PK rechaza una (P2002) y se reintenta.
  async save(customer: Customer): Promise<Customer> {
    const factoryId = customer.getFactoryId();

    for (let attempt = 1; ; attempt++) {
      try {
        const row = await this.prisma.$transaction(async (tx) => {
          const { _max } = await tx.customer.aggregate({
            where: { factoryId },
            _max: { id: true },
          });
          return tx.customer.create({
            data: {
              id: (_max.id ?? 0) + 1,
              factoryId,
              name: customer.getName(),
              lastName: customer.getLastName(),
              phone: customer.getPhone(),
              mail: customer.getMail(),
              isActive: customer.isActive(),
            },
          });
        });
        return this.toDomain(row);
      } catch (error) {
        const isIdCollision =
          error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!isIdCollision || attempt >= MAX_ID_ATTEMPTS) {
          throw error;
        }
      }
    }
  }

  async findById(factoryId: number, id: number): Promise<Customer | null> {
    const row = await this.prisma.customer.findUnique({
      where: { factoryId_id: { factoryId, id } },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Customer[]> {
    const rows = await this.prisma.customer.findMany({
      orderBy: [{ factoryId: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => this.toDomain(row));
  }

  async update(customer: Customer): Promise<void> {
    const id = customer.getId();
    const factoryId = customer.getFactoryId();
    if (!id) {
      throw new NotFoundException(`Customer ${id} not found in factory ${factoryId}`);
    }

    try {
      await this.prisma.customer.update({
        where: { factoryId_id: { factoryId, id } },
        data: {
          name: customer.getName(),
          lastName: customer.getLastName(),
          phone: customer.getPhone(),
          mail: customer.getMail(),
          isActive: customer.isActive(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Customer ${id} not found in factory ${factoryId}`);
      }
      throw error;
    }
  }

  async existsByMail(mail: string, factoryId: number, excludeId?: number): Promise<boolean> {
    const count = await this.prisma.customer.count({
      where: {
        factoryId,
        mail: { equals: mail, mode: 'insensitive' },
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async list(params: CustomerListParams): Promise<CustomerListResult> {
    const { page, limit, factoryId, nameContains, active } = params;

    const where: Prisma.CustomerWhereInput = {
      ...(factoryId !== undefined ? { factoryId } : {}),
      ...(active !== undefined ? { isActive: active } : {}),
      ...(nameContains
        ? {
            OR: [
              { name: { contains: nameContains, mode: 'insensitive' } },
              { lastName: { contains: nameContains, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.customer.findMany({
        where,
        orderBy: [{ factoryId: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.customer.count({ where }),
    ]);

    return { items: rows.map((row) => this.toDomain(row)), total };
  }

  // Los "!" asumen filas completas: si la DB tiene last_name, phone o mail en null,
  // reconstruct() va a fallar hasta resolver esa decisión (relajar dominio o NOT NULL).
  private toDomain(row: CustomerRow): Customer {
    return Customer.reconstruct(
      row.id,
      row.name,
      row.lastName!,
      row.phone!,
      row.mail!,
      row.factoryId,
      row.isActive,
      row.createdAt,
      row.updatedAt,
    );
  }
}
