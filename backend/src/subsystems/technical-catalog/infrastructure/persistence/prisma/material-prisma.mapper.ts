import { Material as MaterialRow, Prisma } from '../../../../../generated/prisma/client';
import { Material } from '../../../core/domain/entities/material.entity';

/** Convierte entre la fila de Prisma y la entidad; el modelo de Prisma no sale de esta carpeta. */
export class MaterialPrismaMapper {
  static toDomain(row: MaterialRow): Material {
    return Material.reconstruct({
      id: row.id,
      name: row.name,
      quality: row.quality,
      nameKey: row.nameKey,
      qualityKey: row.qualityKey,
      createdByUserId: row.createdByUserId,
      createdAt: row.createdAt,
    });
  }

  /** Datos del INSERT. `updatedAt` lo escribe la base. */
  static toCreateData(material: Material): Prisma.MaterialUncheckedCreateInput {
    return {
      name: material.getName(),
      quality: material.getQuality(),
      nameKey: material.getNameKey(),
      qualityKey: material.getQualityKey(),
      createdByUserId: material.getCreatedByUserId(),
    };
  }
}
