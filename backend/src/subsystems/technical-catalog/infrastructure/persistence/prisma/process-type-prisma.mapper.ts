import {
  Prisma,
  ProcessType as ProcessTypeRow,
  ProcessTypePriceHistory as ProcessTypePriceHistoryRow,
} from '../../../../../generated/prisma/client';
import { MoneyAmount } from '../../../core/domain/value-objects/money-amount.vo';
import { ProcessTypePriceChange } from '../../../core/domain/entities/process-type-price-change.entity';
import { ProcessType } from '../../../core/domain/entities/process-type.entity';

/** Convierte entre la fila de Prisma y la entidad; el modelo de Prisma no sale de esta carpeta. */
export class ProcessTypePrismaMapper {
  static toDomain(row: ProcessTypeRow): ProcessType {
    return ProcessType.reconstruct({
      id: row.id,
      name: row.name,
      nameKey: row.nameKey,
      description: row.description,
      hourlyRateArs: row.hourlyRateArs.toNumber(),
      hourlyRateUsd: row.hourlyRateUsd.toNumber(),
      exchangeRate: row.exchangeRate.toNumber(),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }

  /** Importe como decimal exacto de dos posiciones. */
  static toDecimal(amount: MoneyAmount): Prisma.Decimal {
    return new Prisma.Decimal(amount.toFixed2());
  }

  /** Datos del INSERT en el historial. Los valores ya vienen validados con dos decimales. */
  static toPriceChangeCreateData(
    processTypeId: number,
    priceChange: ProcessTypePriceChange,
  ): Prisma.ProcessTypePriceHistoryUncheckedCreateInput {
    return {
      processTypeId,
      changedByUserId: priceChange.getChangedBy().id,
      changedAt: priceChange.getChangedAt(),
      exchangeRate: new Prisma.Decimal(priceChange.getExchangeRate().toFixed(2)),
      previousValueUsd: new Prisma.Decimal(priceChange.getPreviousValueUsd().toFixed(2)),
      newValueUsd: new Prisma.Decimal(priceChange.getNewValueUsd().toFixed(2)),
    };
  }

  /** Datos del UPDATE: todo lo que puede cambiar en una modificación. */
  static toUpdateData(processType: ProcessType): Prisma.ProcessTypeUpdateManyMutationInput {
    return {
      name: processType.getName(),
      nameKey: processType.getNameKey(),
      description: processType.getDescription(),
      hourlyRateArs: ProcessTypePrismaMapper.toDecimal(processType.getHourlyRateArs()),
      hourlyRateUsd: ProcessTypePrismaMapper.toDecimal(processType.getHourlyRateUsd()),
      exchangeRate: ProcessTypePrismaMapper.toDecimal(processType.getExchangeRate()),
      updatedAt: processType.getUpdatedAt()!,
    };
  }

  /** Condición del UPDATE: la fila sigue con los valores que se leyeron. */
  static toUnchangedFilter(previous: ProcessType): Prisma.ProcessTypeWhereInput {
    return {
      id: previous.getId()!,
      name: previous.getName(),
      description: previous.getDescription(),
      hourlyRateArs: ProcessTypePrismaMapper.toDecimal(previous.getHourlyRateArs()),
      hourlyRateUsd: ProcessTypePrismaMapper.toDecimal(previous.getHourlyRateUsd()),
      exchangeRate: ProcessTypePrismaMapper.toDecimal(previous.getExchangeRate()),
    };
  }

  static toPriceChange(
    row: ProcessTypePriceHistoryRow & { changedBy: { id: number; username: string } },
  ): ProcessTypePriceChange {
    return ProcessTypePriceChange.reconstruct({
      id: row.id,
      changedAt: row.changedAt,
      changedBy: { id: row.changedBy.id, username: row.changedBy.username },
      exchangeRate: row.exchangeRate.toNumber(),
      previousValueUsd: row.previousValueUsd.toNumber(),
      newValueUsd: row.newValueUsd.toNumber(),
    });
  }

  /** Datos del INSERT. Los importes viajan como texto con dos decimales: decimales exactos, no punto flotante. */
  static toCreateData(processType: ProcessType, now: Date): Prisma.ProcessTypeCreateInput {
    return {
      name: processType.getName(),
      nameKey: processType.getNameKey(),
      description: processType.getDescription(),
      hourlyRateArs: new Prisma.Decimal(processType.getHourlyRateArs().toFixed2()),
      hourlyRateUsd: new Prisma.Decimal(processType.getHourlyRateUsd().toFixed2()),
      exchangeRate: new Prisma.Decimal(processType.getExchangeRate().toFixed2()),
      createdAt: now,
      updatedAt: now,
    };
  }
}
