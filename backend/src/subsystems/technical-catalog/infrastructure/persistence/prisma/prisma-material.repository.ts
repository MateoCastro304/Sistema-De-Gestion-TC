import { Injectable } from '@nestjs/common';
import { Prisma } from '../../../../../generated/prisma/client';
import { TextKey } from '../../../../../shared/domain/text-key';
import { PrismaClientProvider } from '../../../../../shared/infrastructure/prisma/prisma-client.provider';
import { Material } from '../../../core/domain/entities/material.entity';
import { MaterialAlreadyExists } from '../../../core/domain/errors/material-already-exists.error';
import { compareKeys, compareMaterials } from '../../../core/domain/material-order';
import {
  MaterialListParams,
  MaterialListResult,
  MaterialRepository,
} from '../../../core/domain/ports/material.repository';
import { MaterialPrismaMapper } from './material-prisma.mapper';

@Injectable()
export class PrismaMaterialRepository extends MaterialRepository {
  constructor(private readonly clients: PrismaClientProvider) {
    super();
  }

  async existsByKeys(nameKey: string, qualityKey: string): Promise<boolean> {
    return (await this.clients.current().material.count({ where: { nameKey, qualityKey } })) > 0;
  }

  async findNameByKey(nameKey: string): Promise<string | null> {
    // La grafía es la misma en todos los materiales de un nombre (D-37): cualquiera sirve.
    const row = await this.clients.current().material.findFirst({ where: { nameKey }, select: { name: true } });
    return row?.name ?? null;
  }

  async list({ page, limit, name, quality }: MaterialListParams): Promise<MaterialListResult> {
    // Los textos buscados se normalizan igual que las claves al guardar (sin mayúsculas, acentos ni espacios repetidos).
    const nameKey = TextKey.create(name ?? '').getValue();
    const qualityKey = TextKey.create(quality ?? '').getValue();
    const where: Prisma.MaterialWhereInput = {
      ...(nameKey ? { nameKey } : {}),
      ...(qualityKey ? { qualityKey: { contains: qualityKey } } : {}),
    };

    // El orden natural de la calidad lo aplica la aplicación, no la base (DV-4): se trae el
    // conjunto filtrado (el catálogo tiene decenas de filas), se ordena y se corta la página.
    const rows = await this.clients.current().material.findMany({ where });
    const sorted = rows.map((row) => MaterialPrismaMapper.toDomain(row)).sort(compareMaterials);

    return { items: sorted.slice((page - 1) * limit, page * limit), total: sorted.length };
  }

  async listNames(): Promise<string[]> {
    const rows = await this.clients.current().material.findMany({
      select: { name: true, nameKey: true },
      distinct: ['nameKey'],
    });
    return rows.sort((a, b) => compareKeys(a.nameKey, b.nameKey)).map((row) => row.name);
  }

  async save(material: Material): Promise<Material> {
    try {
      const row = await this.clients.current().material.create({ data: MaterialPrismaMapper.toCreateData(material) });
      return MaterialPrismaMapper.toDomain(row);
    } catch (error) {
      // Dos altas simultáneas con la misma combinación: gana la restricción UNIQUE (name_key, quality_key).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new MaterialAlreadyExists();
      }
      throw error;
    }
  }
}
