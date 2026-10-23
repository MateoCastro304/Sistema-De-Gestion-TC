import { Prisma, ProcessType as ProcessTypeRow } from '../../../../../generated/prisma/client';
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
