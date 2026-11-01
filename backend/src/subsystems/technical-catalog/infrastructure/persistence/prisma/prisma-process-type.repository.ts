import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { PrismaClientProvider } from '../../../../../shared/infrastructure/prisma/prisma-client.provider';
import { PrismaService } from '../../../../../shared/infrastructure/prisma/prisma.service';
import { TextKey } from '../../../../../shared/domain/text-key';
import { ChangeAuthorUnknown } from '../../../core/domain/errors/change-author-unknown.error';
import { ProcessTypePriceChange } from '../../../core/domain/entities/process-type-price-change.entity';
import { ProcessType } from '../../../core/domain/entities/process-type.entity';
import { ProcessTypeNameTaken } from '../../../core/domain/errors/process-type-name-taken.error';
import {
  ProcessTypeListParams,
  ProcessTypeListResult,
  ProcessTypeRepository,
} from '../../../core/domain/ports/process-type.repository';
import { ProcessTypePrismaMapper } from './process-type-prisma.mapper';

@Injectable()
export class PrismaProcessTypeRepository extends ProcessTypeRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly clients: PrismaClientProvider,
  ) {
    super();
  }

  async existsByNameKey(nameKey: string, excludeId?: number): Promise<boolean> {
    const where = excludeId === undefined ? { nameKey } : { nameKey, id: { not: excludeId } };
    return (await this.clients.current().processType.count({ where })) > 0;
  }

  async findById(id: number): Promise<ProcessType | null> {
    const row = await this.clients.current().processType.findUnique({ where: { id } });
    return row ? ProcessTypePrismaMapper.toDomain(row) : null;
  }

  async list({ page, limit, search }: ProcessTypeListParams): Promise<ProcessTypeListResult> {
    // El texto buscado se normaliza igual que name_key al guardar (sin mayúsculas, acentos ni espacios repetidos).
    const where: Prisma.ProcessTypeWhereInput = search
      ? { nameKey: { contains: TextKey.create(search).getValue() } }
      : {};

    // Lectura de solo consulta, nunca dentro de una transacción de negocio: usa el cliente base
    // porque la forma por lotes de $transaction no existe en el cliente transaccional.
    // Una sola transacción: la página y el total salen del mismo estado de la base.
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.processType.findMany({
        where,
        orderBy: [{ nameKey: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.processType.count({ where }),
    ]);

    return { items: rows.map((row) => ProcessTypePrismaMapper.toDomain(row)), total };
  }

  async findPriceHistory(processTypeId: number): Promise<ProcessTypePriceChange[]> {
    const rows = await this.clients.current().processTypePriceHistory.findMany({
      where: { processTypeId },
      // Lectura del autor en app_user (tabla de identity): solo lectura, la escritura sigue siendo de su dueño.
      include: { changedBy: { select: { id: true, username: true } } },
      orderBy: [{ changedAt: 'desc' }, { id: 'desc' }],
    });
    return rows.map((row) => ProcessTypePrismaMapper.toPriceChange(row));
  }

  async save(processType: ProcessType): Promise<ProcessType> {
    try {
      // createdAt y updatedAt salen del mismo instante: en el alta son iguales.
      const row = await this.clients.current().processType.create({
        data: ProcessTypePrismaMapper.toCreateData(processType, new Date()),
      });
      return ProcessTypePrismaMapper.toDomain(row);
    } catch (error) {
      // Dos altas simultáneas con el mismo nombre: gana la restricción UNIQUE (name_key).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ProcessTypeNameTaken();
      }
      throw error;
    }
  }

  async updateIfUnchanged(previous: ProcessType, next: ProcessType): Promise<boolean> {
    try {
      // Una sola escritura condicional: si otro cambio se adelantó, no coincide ninguna fila.
      const result = await this.clients.current().processType.updateMany({
        where: ProcessTypePrismaMapper.toUnchangedFilter(previous),
        data: ProcessTypePrismaMapper.toUpdateData(next),
      });
      return result.count === 1;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ProcessTypeNameTaken();
      }
      throw error;
    }
  }

  async addPriceChange(processTypeId: number, priceChange: ProcessTypePriceChange): Promise<void> {
    try {
      await this.clients.current().processTypePriceHistory.create({
        data: ProcessTypePrismaMapper.toPriceChangeCreateData(processTypeId, priceChange),
      });
    } catch (error) {
      // El usuario que firma el cambio no existe (FK a app_user).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new ChangeAuthorUnknown();
      }
      throw error;
    }
  }
}
