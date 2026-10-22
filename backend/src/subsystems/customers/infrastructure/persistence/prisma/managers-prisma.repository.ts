import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { Prisma, Customer as ManagerRow } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { Manager } from '../../../core/domain/entities/manager';
import { ManagerAlreadyExists } from '../../../core/domain/errors/manager-already-exists.error';
import { ManagerRepository, ManagerListParams, ManagerListResult } from '../../../core/domain/ports/manager.repository';

const MAX_ID_ATTEMPTS = 3;

// La tabla Prisma sigue llamándose `customer` (model `Customer` del schema):
// solo el concepto de dominio se renombró a Manager, no la base de datos.
@Injectable()
export class ManagerPrismaRepository implements ManagerRepository {
  constructor(private readonly prisma: PrismaService) {}

  // El id es correlativo por fábrica (lo hace el trigger en la DB). Prisma exige
  // el id en create(), así que se calcula max+1 de esa fábrica dentro de una
  // transacción. Si dos altas simultáneas chocan, la PK rechaza una (P2002) y se reintenta.
  async save(manager: Manager): Promise<Manager> {
    const factoryId = manager.getFactoryId();

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
              name: manager.getName(),
              lastName: manager.getLastName(),
              phone: manager.getPhone(),
              mail: manager.getMail(),
              isActive: manager.isActive(),
            },
          });
        });
        return this.toDomain(row);
      } catch (error) {
        // Un mail repetido no es un choque de id: no se reintenta.
        const target = error instanceof Prisma.PrismaClientKnownRequestError ? error.meta?.target : undefined;
        const targetFields = Array.isArray(target) ? target : [];
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002' &&
          targetFields.includes('mail')
        ) {
          throw new ConflictException(new ManagerAlreadyExists(manager.getMail() ?? '').message);
        }
        const isIdCollision = error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
        if (!isIdCollision || attempt >= MAX_ID_ATTEMPTS) {
          throw error;
        }
      }
    }
  }

  async findById(factoryId: number, id: number): Promise<Manager | null> {
    const row = await this.prisma.customer.findUnique({
      where: { factoryId_id: { factoryId, id } },
    });
    return row ? this.toDomain(row) : null;
  }

  async findAll(): Promise<Manager[]> {
    const rows = await this.prisma.customer.findMany({
      orderBy: [{ factoryId: 'asc' }, { id: 'asc' }],
    });
    return rows.map((row) => this.toDomain(row));
  }

  async update(manager: Manager): Promise<void> {
    const id = manager.getId();
    const factoryId = manager.getFactoryId();
    if (!id) {
      throw new NotFoundException(`Manager ${id} not found in factory ${factoryId}`);
    }

    try {
      await this.prisma.customer.update({
        where: { factoryId_id: { factoryId, id } },
        data: {
          name: manager.getName(),
          lastName: manager.getLastName(),
          phone: manager.getPhone(),
          mail: manager.getMail(),
          isActive: manager.isActive(),
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new NotFoundException(`Manager ${id} not found in factory ${factoryId}`);
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException(new ManagerAlreadyExists(manager.getMail() ?? '').message);
      }
      throw error;
    }
  }

  async existsByMail(mail: string, factoryId: number, excludeId?: number): Promise<boolean> {
    const count = await this.prisma.customer.count({
      where: {
        factoryId,
        isActive: true,
        mail: { equals: mail, mode: 'insensitive' },
        ...(excludeId !== undefined ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async list(params: ManagerListParams): Promise<ManagerListResult> {
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

  private toDomain(row: ManagerRow): Manager {
    return Manager.reconstruct(
      row.id,
      row.name,
      row.lastName,
      row.phone,
      row.mail,
      row.factoryId,
      row.isActive,
      row.createdAt,
      row.updatedAt,
    );
  }
}
